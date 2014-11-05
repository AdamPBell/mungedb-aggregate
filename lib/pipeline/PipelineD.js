"use strict";

/**
 * Pipeline helper for reading data
 * @class PipelineD
 * @namespace mungedb-aggregate.pipeline
 * @module mungedb-aggregate
 * @constructor
 **/
var PipelineD = module.exports = function PipelineD(){
	if(this.constructor == PipelineD) throw new Error("Never create instances of this! Use the static helpers only.");
}, klass = PipelineD, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var DocumentSource = require('./documentSources/DocumentSource'),
	CursorDocumentSource = require('./documentSources/CursorDocumentSource'),
	SortDocumentSource = require('./documentSources/SortDocumentSource'),
	MatchDocumentSource = require('./documentSources/MatchDocumentSource'),
	Cursor = require('../query/ArrayRunner');

/**
 * Create a Cursor wrapped in a DocumentSourceCursor, which is suitable to be the first source for a pipeline to begin with.
 * This source will feed the execution of the pipeline.
 *
 * //NOTE: Not doing anything here, as we don't use any of these cursor source features
 * //NOTE: DEVIATION FROM THE MONGO: We don't have special optimized cursors; You could support something similar by overriding `Pipeline#run` to call `DocumentSource#coalesce` on the `inputSource` if you really need it.
 *
 * This method looks for early pipeline stages that can be folded into
 * the underlying cursor, and when a cursor can absorb those, they
 * are removed from the head of the pipeline.  For example, an
 * early match can be removed and replaced with a Cursor that will
 * do an index scan.
 *
 * @param pipeline  {Pipeline}  the logical "this" for this operation
 * @param ctx       {Object}    Context for expressions
 * @returns	{CursorDocumentSource}	the cursor that was created
**/
klass.prepareCursorSource = function prepareCursorSource(pipeline, expCtx){

	// get the full "namespace" name
	var data = expCtx.ns; //NOTE: ns will likely be either an array of documents or a document source in munge

	// We will be modifying the source vector as we go
	var sources = pipeline.sources;

	// Inject a MongodImplementation to sources that need them.
	// NOTE: SKIPPED

	// Don't modify the pipeline if we got a DocumentSourceMergeCursor
	// NOTE: SKIPPED


	// Look for an initial match. This works whether we got an initial query or not.
	// If not, it results in a "{}" query, which will be what we want in that case.
	var queryObj = pipeline.getInitialQuery();
	if (queryObj && queryObj instanceof Object && Object.keys(queryObj).length) {
		// This will get built in to the Cursor we'll create, so
		// remove the match from the pipeline
		// NOTE: SKIPPED
	}

	// Find the set of fields in the source documents depended on by this pipeline.
	var deps = pipeline.getDependencies(queryObj);

	// Passing query an empty projection since it is faster to use ParsedDeps::extractFields().
	// This will need to change to support covering indexes (SERVER-12015). There is an
	// exception for textScore since that can only be retrieved by a query projection.
	var projectionForQuery = deps.needTextScore ? deps.toProjection() : {};

	/*
	  Look for an initial sort; we'll try to add this to the
	  Cursor we create.  If we're successful in doing that (further down),
	  we'll remove the $sort from the pipeline, because the documents
	  will already come sorted in the specified order as a result of the
	  index scan.
	*/
	var sortStorage,
		sortObj,
		sortInRunner = false;
	if (sources.length) {
		sortStage = sources[0] instanceof SortDocumentSource ? sources[0] : undefined;
		
		//need to check the next source since we are not deleting the initial match in munge
		if (!sortStorage && sources[0] instanceof MatchDocumentSource){
			sortStage = sources[1] instanceof SortDocumentSource ? sources[1] : undefined;
		}
		if (sortStage) {
			// build the sort key
			sortObj = sortStage.serializeSortKey(/*explain*/false);
			sortInRunner = true;
		}
	}

	// Create the Runner.
	// NOTE: the logic here is munge specific
	var runner;
	if (data.constructor === Array) {
		runner = new ArrayRunner(data);
	} else if (data instanceof DocumentSource) {
		//do something else here.  TODO: make a new Runner Type?
	} else {
		throw new Error('unrecognized data source');
	}


	// DocumentSourceCursor expects a yielding Runner that has had its state saved.
	//runner->setYieldPolicy(Runner::YIELD_AUTO);
	runner.saveState();

	// Put the Runner into a DocumentSourceCursor and add it to the front of the pipeline.
	var source = new DocumentSourceCursor("", runner, pExpCtx);

	// Note the query, sort, and projection for explain.
	source.setQuery(queryObj);
	if (sortInRunner)
		source.setSort(sortObj);

	source.setProjection(deps.toProjection(), deps.toParsedDeps());

	while (sources.length && source.coalesce(sources[0])) {
		sources.shift();
	}

	pipeline.addInitialSource(source);

	return runner;














	var sources = pipeline.sources;

	// NOTE: SKIPPED: look for initial match
	// NOTE: SKIPPED: create a query object

	// Look for an initial simple project; we'll avoid constructing Values for fields that won't make it through the projection
	var projection = {};
	var dependencies;
	var deps = {};
	var status = DocumentSource.GetDepsReturn.SEE_NEXT;
	for (var i=0; i < sources.length && status !== DocumentSource.GetDepsReturn.EXHAUSTIVE; i++) {
		status = sources[i].getDependencies(deps);
		if(Object.keys(deps).length === 0) {
			status = DocumentSource.GetDepsReturn.NOT_SUPPORTED;
		}
	}
	if (status === DocumentSource.GetDepsReturn.EXHAUSTIVE) {
		projection = DocumentSource.depsToProjection(deps);
		dependencies = DocumentSource.parseDeps(deps);
	}

	// NOTE: SKIPPED: Look for an initial sort
	// NOTE: SKIPPED: Create the sort object

	//get the full "namespace" name
	// var fullName = dbName + "." + pipeline.collectionName;

	// NOTE: SKIPPED: if(DEV) log messages

	// Create the necessary context to use a Cursor
	// NOTE: SKIPPED: pSortedCursor bit
	// NOTE: SKIPPED: pUnsortedCursor bit

	// NOTE: Deviating from mongo here. We're passing in a source or set of documents instead of collection name in the ctx.ns field
	var source;
	if(expCtx.ns instanceof DocumentSource){
		source = expCtx.ns;
	} else {
		var cursorWithContext = new CursorDocumentSource.CursorWithContext(/*fullName*/);

		// Now add the Cursor to cursorWithContext
		cursorWithContext._cursor = new Cursor( expCtx.ns );	//NOTE: collectionName will likely be an array of documents in munge

		// wrap the cursor with a DocumentSource and return that
		source = new CursorDocumentSource( cursorWithContext, expCtx );

		// NOTE: SKIPPED: Note the query and sort

		if (Object.keys(projection).length) source.setProjection(projection, dependencies);

		while(sources.length > 0 && source.coalesce(sources[0])) { //Note: Attempting to coalesce into the cursor source
			sources.shift();
		}
	}

	pipeline.addInitialSource(source);
};
