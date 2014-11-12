"use strict";
var CursorDocumentSource = require("./documentSources/CursorDocumentSource"),
	SortDocumentSource = require("./documentSources/SortDocumentSource"),
	getRunner = require("../query").getRunner;

/**
 * Pipeline helper for reading data
 * @class PipelineD
 * @namespace mungedb-aggregate.pipeline
 * @module mungedb-aggregate
 * @constructor
 **/
var PipelineD = module.exports = function PipelineD(){
	throw new Error("Never create instances of this! Use the static helpers only.");
}, klass = PipelineD;

/**
 * Create a Cursor wrapped in a DocumentSourceCursor, which is suitable to be the first source for a pipeline to begin with.
 * This source will feed the execution of the pipeline.
 *
 * //NOTE: Not doing anything here, as we don't use any of these cursor source features
 * //NOTE: DEVIATION FROM THE MONGO: we don't have special optimized cursors but could do it if needed
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

	// We will be modifying the source vector as we go
	var sources = pipeline.sources;

	// Inject a MongodImplementation to sources that need them.
	// NOTE: SKIPPED

	// Don't modify the pipeline if we got a DocumentSourceMergeCursor
	// NOTE: SKIPPED


	// Look for an initial match. This works whether we got an initial query or not.
	// If not, it results in a "{}" query, which will be what we want in that case.
	var queryObj = pipeline.getInitialQuery(),
		match;
	if (queryObj && queryObj instanceof Object && Object.keys(queryObj).length) {
		// This will get built in to the Cursor we'll create, so
		// remove the match from the pipeline
		match = sources.shift();
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
	var sortStage,
		sortObj,
		sortInRunner = false;
	if (sources.length) {
		sortStage = sources[0] instanceof SortDocumentSource ? sources[0] : undefined;
		if (sortStage) {
			// build the sort key
			sortObj = sortStage.serializeSortKey(/*explain*/false);
			sortInRunner = true;
		}
	}

	//munge deviation: the runner is (usually) not actually handling the initial query, so we need to add it back to the pipeline
	if (match){
		sources.unshift(match);
	}

	// Create the Runner.
	// NOTE: the logic here is simplified for munge
	var runner = getRunner(expCtx.ns, queryObj, sortObj, projectionForQuery, sources);

	// DocumentSourceCursor expects a yielding Runner that has had its state saved.
	//runner.setYieldPolicy(Runner.RunnerState.YIELD_AUTO); //Skipped as we don't really support yielding yet
	runner.saveState();

	// Put the Runner into a DocumentSourceCursor and add it to the front of the pipeline.
	var source = new CursorDocumentSource("", runner, expCtx);

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
};
