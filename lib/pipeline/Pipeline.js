"use strict";

/**
 * mongodb "commands" (sent via db.$cmd.findOne(...)) subclass to make a command.  define a singleton object for it.
 * @class Pipeline
 * @namespace mungedb-aggregate.pipeline
 * @module mungedb-aggregate
 * @constructor
 **/
// CONSTRUCTOR
var Pipeline = module.exports = function Pipeline(theCtx){
	this.sources = null;
	this.explain = false;
	this.splitMongodPipeline = false;
	this.ctx = theCtx;
	this.SYNC_MODE = false;
}, klass = Pipeline, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var DocumentSource = require("./documentSources/DocumentSource"),
	LimitDocumentSource = require('./documentSources/LimitDocumentSource'),
	MatchDocumentSource = require('./documentSources/MatchDocumentSource'),
	ProjectDocumentSource = require('./documentSources/ProjectDocumentSource'),
	SkipDocumentSource = require('./documentSources/SkipDocumentSource'),
	UnwindDocumentSource = require('./documentSources/UnwindDocumentSource'),
	GroupDocumentSource = require('./documentSources/GroupDocumentSource'),
	OutDocumentSource = require('./documentSources/OutDocumentSource'),
	GeoNearDocumentSource = require('./documentSources/GeoNearDocumentSource'),
	RedactDocumentSource = require('./documentSources/RedactDocumentSource'),
	SortDocumentSource = require('./documentSources/SortDocumentSource'),
	DepsTracker = require('./DepsTracker');

klass.COMMAND_NAME = "aggregate";
klass.PIPELINE_NAME = "pipeline";
klass.EXPLAIN_NAME = "explain";
klass.FROM_ROUTER_NAME = "fromRouter";
klass.SERVER_PIPELINE_NAME = "serverPipeline";
klass.MONGOS_PIPELINE_NAME = "mongosPipeline";

klass.stageDesc = {};//attaching this to the class for test cases
klass.stageDesc[GeoNearDocumentSource.geoNearName] = GeoNearDocumentSource.createFromJson;
klass.stageDesc[GroupDocumentSource.groupName] = GroupDocumentSource.createFromJson;
klass.stageDesc[LimitDocumentSource.limitName] = LimitDocumentSource.createFromJson;
klass.stageDesc[MatchDocumentSource.matchName] = MatchDocumentSource.createFromJson;
klass.stageDesc[OutDocumentSource.outName] = OutDocumentSource.createFromJson;
klass.stageDesc[ProjectDocumentSource.projectName] = ProjectDocumentSource.createFromJson;
klass.stageDesc[RedactDocumentSource.redactName] = ProjectDocumentSource.createFromJson;
klass.stageDesc[SkipDocumentSource.skipName] = SkipDocumentSource.createFromJson;
klass.stageDesc[SortDocumentSource.sortName] = SortDocumentSource.createFromJson;
klass.stageDesc[UnwindDocumentSource.unwindName] = UnwindDocumentSource.createFromJson;
klass.nStageDesc = Object.keys(klass.stageDesc).length;

klass.optimizations = {};
klass.optimizations.local = {};
klass.optimizations.sharded = {};

/**
 * Moves $match before $sort when they are placed next to one another
 * @static
 * @method moveMatchBeforeSort
 * @param pipelineInst An instance of a Pipeline
 */
klass.optimizations.local.moveMatchBeforeSort = function moveMatchBeforeSort(pipelineInst) {
	var sources = pipelineInst.sources;
	for(var srcn = sources.length, srci = 1; srci < srcn; ++srci) {
		var source = sources[srci];
		if(source.constructor === MatchDocumentSource) {
			var previous = sources[srci - 1];
			if(previous && previous.constructor === SortDocumentSource) { //Added check that previous exists
				/* swap this item with the previous */
				sources[srci] = previous;
				sources[srci-1] = source;
			}
		}
	}
};

/**
 * Moves $limit before $skip when they are placed next to one another
 * @static
 * @method moveLimitBeforeSkip
 * @param pipelineInst An instance of a Pipeline
 */
klass.optimizations.local.moveLimitBeforeSkip = function moveLimitBeforeSkip(pipelineInst) {
	var sources = pipelineInst.sources;
	if(sources.length === 0) return;
	for(var i = sources.length - 1; i >= 1 /* not looking at 0 */; i--) {
		var limit = sources[i].constructor === LimitDocumentSource ? sources[i] : undefined,
			skip = sources[i-1].constructor === SkipDocumentSource ? sources[i-1] : undefined;
		if(limit && skip) {
			limit.setLimit(limit.getLimit() + skip.getSkip());
			sources[i-1] = limit;
			sources[i] = skip;

			// Start at back again. This is needed to handle cases with more than 1 $limit
			// (S means skip, L means limit)
			//
			// These two would work without second pass (assuming back to front ordering)
			// SL   -> LS
			// SSL  -> LSS
			//
			// The following cases need a second pass to handle the second limit
			// SLL  -> LLS
			// SSLL -> LLSS
			// SLSL -> LLSS
			i = sources.length; // decremented before next pass
		}
	}
};

/**
 * Attempts to coalesce every pipeline stage into the previous pipeline stage, starting after the first
 * @static
 * @method coalesceAdjacent
 * @param pipelineInst An instance of a Pipeline
 */
klass.optimizations.local.coalesceAdjacent = function coalesceAdjacent(pipelineInst) {
	var sources = pipelineInst.sources;
	if(sources.length === 0) return;

	// move all sources to a temporary list
	var moveSrc = sources.pop(),
		tempSources = [];
	while(moveSrc) {
		tempSources.unshift(moveSrc);
		moveSrc = sources.pop();
	}

	// move the first one to the final list
	sources.push(tempSources[0]);

	// run through the sources, coalescing them or keeping them
	for(var tempn = tempSources.length, tempi = 1; tempi < tempn; ++tempi) {
		// If we can't coalesce the source with the last, then move it
		// to the final list, and make it the new last.  (If we succeeded,
		// then we're still on the same last, and there's no need to move
		// or do anything with the source -- the destruction of tempSources
		// will take care of the rest.)
		var lastSource = sources[sources.length-1],
			tempSrc = tempSources[tempi];
		if(!(lastSource && tempSrc)) {
			throw new Error('Must have a last and current source'); // verify(lastSource && tempSrc);
		}
		if(!lastSource.coalesce(tempSrc)) sources.push(tempSrc);
	}
};

/**
 * Iterates over sources in the pipelineInst, optimizing each
 * @static
 * @method optimizeEachDocumentSource
 * @param pipelineInst An instance of a Pipeline
 */
klass.optimizations.local.optimizeEachDocumentSource = function optimizeEachDocumentSource(pipelineInst) {
	var sources = pipelineInst.sources;
	for(var srci = 0, srcn = sources.length; srci < srcn; ++srci) {
		sources[srci].optimize();
	}
};

/**
 * Auto-places a $match before a $redact when the $redact is the first item in a pipeline
 * @static
 * @method duplicateMatchBeforeInitalRedact
 * @param pipelineInst An instance of a Pipeline
 */
klass.optimizations.local.duplicateMatchBeforeInitalRedact = function duplicateMatchBeforeInitalRedact(pipelineInst) {
	var sources = pipelineInst.sources;
	if(sources.length >= 2 && sources[0].constructor === RedactDocumentSource) {
		if(sources[1].constructor === MatchDocumentSource) {
			var match = sources[1],
				redactSafePortion = match.redactSafePortion();
			if(Object.keys(redactSafePortion).length > 0) {
				sources.shift(MatchDocumentSource.createFromJson(redactSafePortion, pipelineInst.ctx));
			}
		}
	}
};

//SKIPPED: addRequiredPrivileges

/**
 * Perform optimizations for a pipeline through sharding
 * @method splitForSharded
 */
proto.splitForSharded = function splitForSharded() {
	var shardPipeline = new Pipeline({});
	shardPipeline.explain = this.explain;

	klass.optimizations.sharded.findSplitPoint(shardPipeline, this);
	klass.optimizations.sharded.moveFinalUnwindFromShardsToMerger(shardPipeline, this);
	//klass.optimizations.sharded.limitFieldsSentFromShardsToMerger(shardPipeline, this);
	return shardPipeline;
};

/**
 * Split the source into Merge sources and Shard sources
 * @static
 * @method findSplitPoint
 * @param shardPipe Shard sources
 * @param mergePipe Merge sources
 */
klass.optimizations.sharded.findSplitPoint = function findSplitPoint(shardPipe, mergePipe) {
	while(mergePipe.sources.length > 0) {
		var current = mergePipe.sources[0];
		mergePipe.sources.splice(0, 1);

		if (typeof current.isSplittable != "undefined") {
			shardPipe.sources.push(current);
		}
		else {
			var shardSource = current.getShardSource(),
				mergeSource = current.getMergeSource();
			if (typeof shardSource != "undefined") { shardPipe.sources.push(shardSource); }		//push_back
			if (typeof mergeSource != "undefined") { mergePipe.sources.unshift(mergeSource); }	//push_front
			break;
		}
	}
};

/**
 * Optimize pipeline through moving unwind to the end
 * @static
 * @method moveFinalUnwindFromShardsToMerger
 * @param shardPipe shard sources
 * @param mergePipe merge sources
 */
klass.optimizations.sharded.moveFinalUnwindFromShardsToMerger = function moveFinalUnwindFromShardsToMerger(shardPipe, mergePipe) {
	while((shardPipe.sources != null) && (!shardPipe.sources.length > 0 
			&& shardPipe.sources[length-1].constructor === UnwindDocumentSource)) {
		mergePipe.sources.unshift(shardPipe.sources[length-1]);
		shardPipe.sources.pop();
	}
};

//SKIPPED: optimizations.sharded.limitFieldsSentFromShardsToMerger.  Somehow what this produces is not handled by Expression.js (err 16404)
/**
 * Optimize pipeline by adding $project stage if shard fields are not exhaustive
 * @static
 * @method limitFieldsSentFromShardsToMerger
 * @param shardPipe shard sources
 * @param mergePipe merge sources
 */
// klass.optimizations.sharded.limitFieldsSentFromShardsToMerger = function limitFieldsSentFromShardsToMerger(shardPipe, mergePipe) {
// 	var mergeDeps = mergePipe.getDependencies(shardPipe.getInitialQuery());
// 	if (mergeDeps.needWholeDocument) {
// 		return;
// 	}
// 	if (mergeDeps.fields == null) {
// 		mergeDeps.fields = {};
// 	}
// 	if (mergeDeps.fields.length == 0) {
// 		mergeDeps.fields["_id"] = 0;
// 	}
// 	if (shardPipe.sources == null) {
// 		shardPipe.sources = {};
// 	}
// 	//NOTE: Deviation from Mongo: not setting mergeDeps.needTextScore because we aren't handling that (Document meta stuff)

//     // HEURISTIC: only apply optimization if none of the shard stages have an exhaustive list of
//     // field dependencies. While this may not be 100% ideal in all cases, it is simple and
//     // avoids the worst cases by ensuring that:
//     // 1) Optimization IS applied when the shards wouldn't have known their exhaustive list of
//     //    dependencies. This situation can happen when a $sort is before the first $project or
//     //    $group. Without the optimization, the shards would have to reify and transmit full
//     //    objects even though only a subset of fields are needed.
//     // 2) Optimization IS NOT applied immediately following a $project or $group since it would
//     //    add an unnecessary project (and therefore a deep-copy).
//     for (var i = 0; i < shardPipe.sources.length; i++) {
//         if (shardPipe.sources.getDependencies() & DocumentSource.GetDepsReturn.EXHAUSTIVE_FIELDS)
//             return;
//     }

//     // if we get here, add the project.
//     shardPipe.sources.push(ProjectDocumentSource.createFromJson({$project: mergeDeps.toProjection()[0]}, shardPipe.ctx));
// };

/**
 * Create an `Array` of `DocumentSource`s from the given JSON pipeline
 * // NOTE: DEVIATION FROM MONGO: split out into a separate function to better allow extensions (was in parseCommand)
 * @static
 * @method parseDocumentSources
 * @param pipeline  {Array}  The JSON pipeline
 * @returns {Array}  The parsed `DocumentSource`s
 */
klass.parseDocumentSources = function parseDocumentSources(pipeline, ctx){
	var sources = [];
	for (var nSteps = pipeline.length, iStep = 0; iStep < nSteps; ++iStep) {
		// pull out the pipeline element as an object
		var pipeElement = pipeline[iStep];
		if (!(pipeElement instanceof Object)) throw new Error("pipeline element " + iStep + " is not an object; code 15942");
		var obj = pipeElement;

		// Parse a pipeline stage from 'obj'.
		if (Object.keys(obj).length !== 1) throw new Error("A pipeline stage specification object must contain exactly one field; code 16435");
		var stageName = Object.keys(obj)[0],
			stageSpec = obj[stageName];

		// Create a DocumentSource pipeline stage from 'stageSpec'.
		var desc = klass.stageDesc[stageName];
		if (!desc) throw new Error("Unrecognized pipeline stage name: '" + stageName + "'; uassert code 16436");

		// Parse the stage
		var stage = desc(stageSpec, ctx);
		if (!stage) throw new Error("Stage must not be undefined!"); // verify(stage)
		sources.push(stage);

		if(stage.constructor === OutDocumentSource && iStep !== nSteps - 1) {
			throw new Error("$out can only be the final stage in the pipeline; code 16991");
		}
	}
	return sources;
};

/**
 * Create a pipeline from the command.
 * @static
 * @method parseCommand
 * @param cmdObj  {Object}  The command object sent from the client
 * @param   cmdObj.aggregate            {Array}    the thing to aggregate against;	// NOTE: DEVIATION FROM MONGO: expects an Array of inputs rather than a collection name
 * @param   cmdObj.pipeline             {Object}   the JSON pipeline of `DocumentSource` specs
 * @param   cmdObj.explain              {Boolean}  should explain?
 * @param   cmdObj.fromRouter           {Boolean}  is from router?
 * @param   cmdObj.splitMongodPipeline	{Boolean}  should split?
 * @param ctx     {Object}  Not used yet in mungedb-aggregate
 * @returns	{Array}	the pipeline, if created, otherwise a NULL reference
 */
klass.parseCommand = function parseCommand(cmdObj, ctx){
	var pipelineNamespace = require("./"),
		Pipeline = pipelineNamespace.Pipeline,	// using require in case Pipeline gets replaced with an extension
		pipelineInst = new Pipeline(ctx);

	//gather the specification for the aggregation
	var pipeline;
	for(var fieldName in cmdObj){
		var cmdElement = cmdObj[fieldName];
		if(fieldName[0] == "$")									continue;
		else if(fieldName == "cursor")							continue;
		else if(fieldName == klass.COMMAND_NAME)				continue;										//look for the aggregation command
		else if(fieldName == klass.PIPELINE_NAME)				pipeline = cmdElement;							//check for the pipeline of JSON doc srcs
		else if(fieldName == klass.EXPLAIN_NAME)				pipelineInst.explain = cmdElement;				//check for explain option
		else if(fieldName == klass.FROM_ROUTER_NAME)			ctx.inShard = cmdElement;						//if the request came from the router, we're in a shard
		else if(fieldName == "allowDiskUsage") {
			if(typeof cmdElement !== 'boolean') throw new Error("allowDiskUsage must be a bool, not a " + typeof allowDiskUsage+ "; uassert code 16949");
		}
		else throw new Error("unrecognized field " + JSON.stringify(fieldName));
	}

	/**
	 * If we get here, we've harvested the fields we expect for a pipeline
	 * Set up the specified document source pipeline.
	 */
	// NOTE: DEVIATION FROM MONGO: split this into a separate function to simplify and better allow for extensions (now in parseDocumentSources)
	pipelineInst.sources = Pipeline.parseDocumentSources(pipeline, ctx);
	klass.optimizations.local.moveMatchBeforeSort(pipelineInst);
	klass.optimizations.local.moveLimitBeforeSkip(pipelineInst);
	klass.optimizations.local.coalesceAdjacent(pipelineInst);
	klass.optimizations.local.optimizeEachDocumentSource(pipelineInst);
	klass.optimizations.local.duplicateMatchBeforeInitalRedact(pipelineInst);

	return pipelineInst;
};

// sync callback for Pipeline#run if omitted
klass.SYNC_CALLBACK = function(err, results){
	if (err) throw err;
	return results.result;
};

function ifError(err) {
	if (err) throw err;
}

/**
 * Gets the initial $match query when $match is the first pipeline stage
 * @method run
 * @param	inputSource		{DocumentSource}	The input document source for the pipeline
 * @param	[callback]		{Function}			Optional callback function if using async extensions
 * @return {Object}	An empty object or the match spec
 */
proto.getInitialQuery = function getInitialQuery() {
	var sources = this.sources;
	if(sources.length === 0) {
		return {};
	}

	/* look for an initial $match */
	var match = sources[0].constructor === MatchDocumentSource ? sources[0] : undefined;
	if(!match) return {};

	return match.getQuery();
};

/**
 * Creates the JSON representation of the pipeline
 * @method run
 * @param	inputSource		{DocumentSource}	The input document source for the pipeline
 * @param	[callback]		{Function}			Optional callback function if using async extensions
 * @return {Object}	An empty object or the match spec
 */
proto.serialize = function serialize() {
	var serialized = {},
		array = [];

	// create an array out of the pipeline operations
	for (var source in this.sources) {
	//this.sources.forEach(function(source) {
		source.serializeToArray(array);
	}

	serialized[klass.COMMAND_NAME] = this.ctx && this.ctx.ns && this.ctx.ns.coll ? this.ctx.ns.coll : '';
	serialized[klass.PIPELINE_NAME] = array;

	if(this.explain) serialized[klass.EXPLAIN_NAME] = this.explain;

	return serialized;
};

/**
 * Points each source at its previous source
 * @method stitch
 */
proto.stitch = function stitch() {
	if(this.sources.length <= 0) throw new Error("should not have an empty pipeline; massert code 16600");

	/* chain together the sources we found */
	var prevSource = this.sources[0];
	for(var srci = 1, srcn = this.sources.length; srci < srcn; srci++) {
		var tempSource = this.sources[srci];
		tempSource.setSource(prevSource);
		prevSource = tempSource;
	}
};

/**
 * Run the pipeline
 * @method run
 * @param callback {Function} Optional. Run the pipeline in async mode; callback(err, result)
 * @return result {Object} The result of executing the pipeline
 */
proto.run = function run(callback) {
	// should not get here in the explain case
	if(this.explain) throw new Error("Should not be running a pipeline in explain mode!");

	/* NOTE: DEVIATION FROM MONGO SOURCE. WE'RE SUPPORTING SYNC AND ASYNC */
	if(this.SYNC_MODE) {
		callback();
		return this._runSync();
	} else {
		return this._runAsync(callback);
	}
};

/**
 * Get the last document source in the pipeline
 * @method _getFinalSource
 * @return {Object}		The DocumentSource at the end of the pipeline
 * @private
 */
proto._getFinalSource = function _getFinalSource() {
	return this.sources[this.sources.length - 1];
};

/**
 * Run the pipeline synchronously
 * @method _runSync
 * @return {Object}		The results object {result:resultArray}
 * @private
 */
proto._runSync = function _runSync(callback) {
	var resultArray = [],
		finalSource = this._getFinalSource(),
		handleErr = function(err) {
			if(err) throw err;
		},
		next;
	while((next = finalSource.getNext(handleErr)) !== DocumentSource.EOF) {
		resultArray.push(next);
	}
	return {result:resultArray};
};

/**
 * Run the pipeline asynchronously
 * @method _runAsync
 * @param callback {Function} callback(err, resultObject)
 * @private
 */
proto._runAsync = function _runAsync(callback) {
	var resultArray = [],
		finalSource = this._getFinalSource(),
		gotNext = function(err, doc) {
			if(err) return callback(err);
			if(doc !== DocumentSource.EOF) {
				resultArray.push(doc);
				return setImmediate(function() { //setImmediate to avoid callstack size issues
					finalSource.getNext(gotNext);
				});
			} else {
				return callback(null, {result:resultArray});
			}
		};
	finalSource.getNext(gotNext);
};

/**
 * Get the pipeline explanation
 * @method writeExplainOps
 * @return {Array}	An array of source explanations
 */
proto.writeExplainOps = function writeExplainOps() {
	var array = [];
	this.sources.forEach(function(source) {
		source.serializeToArray(array, /*explain=*/true);
	});
	return array;
};

/**
 * Set the source of documents for the pipeline
 * @method addInitialSource
 * @param source {DocumentSource}
 */
proto.addInitialSource = function addInitialSource(source) {
	this.sources.unshift(source);
};

//SKIPPED: canRunInMongos

//Note: Deviation from Mongo: Mongo 2.6.5 passes a param to getDependencies
//	to calculate TextScore.  mungedb-aggregate doesn't do this, so no param is needed.
proto.getDependencies = function getDependencies () {
    var deps = new DepsTracker(), 
		knowAllFields = false;

    //NOTE: Deviation from Mongo -- We aren't using Meta and textscore
    for (var i=0; i < this.sources.length && !knowAllFields; i++) {
        var localDeps = new DepsTracker(),
        	status = this.sources[i].getDependencies(localDeps);

        if (status === DocumentSource.GetDepsReturn.NOT_SUPPORTED) {
            // Assume this stage needs everything. We may still know something about our
            // dependencies if an earlier stage returned either EXHAUSTIVE_FIELDS or
            // EXHAUSTIVE_META.
            break;
        }

        if (!knowAllFields) {
            for (var key in localDeps.fields)
            	deps.fields[key] = localDeps.fields[key];

            if (localDeps.needWholeDocument)
                deps.needWholeDocument = true;
            knowAllFields = status & DocumentSource.GetDepsReturn.EXHAUSTIVE_FIELDS;
        }

    }

    if (!knowAllFields)
        deps.needWholeDocument = true; // don't know all fields we need

    return deps;
};
