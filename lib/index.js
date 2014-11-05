"use strict";

/**
 * Used to aggregate `inputs` using a MongoDB-style `pipeline`
 *
 * If `inputs` is given, it will run the `inputs` through the `pipeline` and call the `callback` with the results.
 * If `inputs` is omitted, it will return an "aggregator" function so you can reuse the given `pipeline` against various `inputs`.
 *
 * NOTE: you should be mindful about reusing the same `pipeline` against disparate `inputs` because document coming in can alter the state of it's `DocumentSource`s
 *
 * @method aggregate
 * @namespace mungedb
 * @module mungedb-aggregate
 * @param pipeline  {Array}   The list of pipeline document sources in JSON format
 * @param [ctx]     {Object}  Optional context object to pass through to pipeline
 * @param [inputs]  {Array}   Optional inputs to pass through the `docSrcs` pipeline
 * @param [callback]             {Function}                                 Optional callback if using async extensions, called when done
 * @param   callback.err           {Error}                                    The Error if one occurred
 * @param   callback.docs          {Array}                                    The resulting documents
 **/
exports = module.exports = function aggregate(pipeline, ctx, inputs, callback) {	// function-style interface; i.e., return the utility function directly as the require
	var DocumentSource = exports.pipeline.documentSources.DocumentSource;
	if (ctx instanceof Array || ctx instanceof DocumentSource) callback = inputs, inputs = ctx, ctx = {};
	var pipelineInst = exports.pipeline.Pipeline.parseCommand({
			pipeline: pipeline
		}, ctx),
		aggregator = function aggregator(ctx, inputs, callback) {
			if (ctx instanceof Array || ctx instanceof DocumentSource) callback = inputs, inputs = ctx, ctx = {};
			if (!callback) callback = exports.SYNC_CALLBACK;
			if (!inputs) return callback("arg `inputs` is required");

			// rebuild the pipeline on subsequent calls
			if (!pipelineInst) {
				pipelineInst = exports.pipeline.Pipeline.parseCommand({
					pipeline: pipeline
				}, ctx);
			}

			// use or build input src
			var src;
			if(inputs instanceof DocumentSource){
				src = inputs;
			}else{
				try{
					ctx.ns = inputs;	//NOTE: use the given `inputs` directly; hacking so that the cursor source will be our inputs instead of the context namespace
					src = exports.pipeline.PipelineD.prepareCursorSource(pipelineInst, ctx);
				}catch(err){
					return callback(err);
				}
			}

			var runCallback;
			if (!callback) {
				runCallback = exports.SYNC_CALLBACK;
				pipelineInst.SYNC_MODE = true;
			} else {
				runCallback = function aggregated(err, results){
				if(err) return callback(err);
				return callback(null, results.result);
		};
			}

			// run the pipeline against
			pipelineInst.stitch();
			var results = pipelineInst.run(runCallback);
			return results ? results.result : undefined;
		};
	if(inputs) return aggregator(ctx, inputs, callback);
	return aggregator;
};

// sync callback for aggregate if none was provided
exports.SYNC_CALLBACK = function(err, docs){
	if (err) throw err;
	return docs;
};

// package-style interface; i.e., return a function underneath of the require
exports.aggregate = exports;

//Expose these so that mungedb-aggregate can be extended.
exports.Cursor = require("./Cursor");
exports.pipeline = require("./pipeline/");
exports.query = require("./query/");

// version info
exports.version = "r2.5.4";
exports.gitVersion = "ffd52e5f46cf2ba74ba931c78da62d4a7f480d8e";

// error code constants
exports.ERRORS = require('./Errors.js');
