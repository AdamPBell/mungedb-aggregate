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
	Cursor = require('../Cursor');

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
