"use strict";
/**
 * Used to aggregate `inputs` using a MongoDB-style `pipeline`
 *
 * If `inputs` is given, it will run the `inputs` through the `pipeline` and call the `callback` with the results.
 * If `inputs` is omitted, it will return an "aggregator" function so you can reuse the given `pipeline` against various `inputs`.
 *
 * @method aggregate
 * @namespace mungedb
 * @module mungedb-aggregate
 * @param pipelineObj  {Array|Object}   The list of pipeline document sources in JSON format or object with pipeline and options
 * @param [ctx]     {Object}  Optional context object to pass through to pipeline
 * @param [inputs]  {Array}   Optional inputs to pass through the `docSrcs` pipeline
 * @param [callback]             {Function}                                 Optional callback if using async extensions, called when done
 * @param   callback.err           {Error}                                    The Error if one occurred
 * @param   callback.docs          {Array}                                    The resulting documents
 **/
exports = module.exports = function aggregate(pipelineObj, ctx, inputs, callback) {	// export directly for a function-style interface
	var DocumentSource = exports.pipeline.documentSources.DocumentSource;
	if (ctx instanceof Array || ctx instanceof DocumentSource) callback = inputs, inputs = ctx, ctx = {};
	ctx = ctx || {};
	var pipelineInst;

	try {
		//Set up the command Object
		pipelineObj = pipelineObj instanceof Array ? {pipeline: pipelineObj} : pipelineObj;
		if (!(pipelineObj instanceof Object)) throw new Error("pipelineObj must be either an Object or an Array");
		for (var key in exports.cmdDefaults) {
			if (exports.cmdDefaults.hasOwnProperty(key) && pipelineObj[key] === undefined) {
				pipelineObj[key] = exports.cmdDefaults[key];
			}
		}
		pipelineInst = exports.pipeline.Pipeline.parseCommand(pipelineObj, ctx);
	} catch(ex) {
		// Error handling is funky since this can be used multiple different ways
		if (callback) {
			if (inputs) {
				return callback(ex);
			} else {
				return function aggregator(ctx, inputs, callback) {
					if (ctx instanceof Array || ctx instanceof DocumentSource) callback = inputs, inputs = ctx, ctx = {};
					return callback(ex);
				};
			}
		} else {
			throw ex;
		}
	}

	if (pipelineObj.explain) {
		if (inputs) {
			ctx.ns = inputs; //NOTE: use given `inputs` directly; hacking cursor source to use our inputs instead of the ctx namespace
			exports.pipeline.PipelineD.prepareCursorSource(pipelineInst, ctx);
		}
		return pipelineInst.writeExplainOps();
	}

	var aggregator = function aggregator(ctx, inputs, callback) {
			if (ctx instanceof Array || ctx instanceof DocumentSource) callback = inputs, inputs = ctx, ctx = {};
			var batchSize = pipelineObj.batchSize;

			if (!callback) {
				batchSize = Infinity;
				callback = exports.SYNC_CALLBACK;
			}
			if (!inputs) return callback("arg `inputs` is required");

			try {
				// rebuild the pipeline on subsequent calls
				if (!pipelineInst) {
					pipelineInst = exports.pipeline.Pipeline.parseCommand(pipelineObj, ctx);
				}
				ctx.ns = inputs; //NOTE: use given `inputs` directly; hacking cursor source to use our inputs instead of the ctx namespace
				exports.pipeline.PipelineD.prepareCursorSource(pipelineInst, ctx);
			} catch(err) {
				return callback(err);
			}
			pipelineInst.stitch();

			var batch = [];
			pipelineInst.run(function aggregated(err, doc){
				pipelineInst = null;
				if (!callback) return;
				if (err) return callback(err), callback = undefined;
				if (doc === null) {
					callback(null, batch);
					if (batchSize !== Infinity) {
						callback(null, null); //this is to tell the caller that that we are done aggregating
					}
					callback = undefined; //we are officially done. make sure the callback doesn't get called anymore
					return;
				}
				batch.push(doc);
				if (batch.length >= batchSize) {
					callback(null, batch);
					batch = [];
					return;
				}
			});
			return batch;
		};
	if (inputs) return aggregator(ctx, inputs, callback);
	return aggregator;
};

// sync callback for aggregate if none was provided
exports.SYNC_CALLBACK = function(err, docs){
	if (err) throw err;
	return docs;
};

exports.cmdDefaults = {
	batchSize: 150,
	explain: false,
};

// package-style interface; i.e., return a function underneath of the require
exports.aggregate = exports;

//Expose these so that mungedb-aggregate can be extended.
exports.pipeline = require("./pipeline/");
exports.query = require("./query/");
exports.errors = require("./errors");

// version info
exports.version = "r2.6.5";
exports.gitVersion = "e99d4fcb4279c0279796f237aa92fe3b64560bf6";
