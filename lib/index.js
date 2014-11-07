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
 * @param pipelineObj  {Array|Object}   The list of pipeline document sources in JSON format or object with pipeline and options
 * @param [ctx]     {Object}  Optional context object to pass through to pipeline
 * @param [inputs]  {Array}   Optional inputs to pass through the `docSrcs` pipeline
 * @param [callback]             {Function}                                 Optional callback if using async extensions, called when done
 * @param   callback.err           {Error}                                    The Error if one occurred
 * @param   callback.docs          {Array}                                    The resulting documents
 **/
exports = module.exports = function aggregate(pipelineObj, ctx, inputs, callback) {	// function-style interface; i.e., return the utility function directly as the require
	var DocumentSource = exports.pipeline.documentSources.DocumentSource;
	if (ctx instanceof Array || ctx instanceof DocumentSource) callback = inputs, inputs = ctx, ctx = {};
	ctx = ctx || {};
	var parsePipelineInst;
	
	try {
		//Set up the command Object
		pipelineObj = (pipelineObj instanceof Array) ? {pipeline: pipelineObj} : pipelineObj;
		if (!(pipelineObj instanceof Object)) throw new Error("pipelineObj must be either an Object or an Array");
		for (var key in exports.cmdDefaults){
			if (exports.cmdDefaults.hasOwnProperty(key) && pipelineObj[key] === undefined){
				pipelineObj[key] = exports.cmdDefaults[key];
			}
		}
		parsePipelineInst = exports.pipeline.Pipeline.parseCommand(pipelineObj, ctx);
	} catch(ex) {
		// Error handling is funky since this can be used multiple different ways
		if (callback){
			if (inputs) return callback(ex);
			else {
				return function aggregator(ctx, inputs, callback) {
					if (ctx instanceof Array || ctx instanceof DocumentSource) callback = inputs, inputs = ctx, ctx = {};
					return callback(ex);
				};
			}
		} else {
			throw ex;
		}
	}
	
	if (pipelineObj.explain){
		if (inputs){
			ctx.ns = inputs;	//NOTE: use the given `inputs` directly; hacking so that the cursor source will be our inputs instead of the context namespace
			exports.pipeline.PipelineD.prepareCursorSource(parsePipelineInst, ctx);
		}
		return parsePipelineInst.writeExplainOps();
	}
	
	var aggregator = function aggregator(ctx, inputs, callback) {
			if (ctx instanceof Array || ctx instanceof DocumentSource) callback = inputs, inputs = ctx, ctx = {};
			var batchSize = pipelineObj.batchSize,
				pipelineInst = parsePipelineInst;
				
			parsePipelineInst = null;
			
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
				ctx.ns = inputs;	//NOTE: use the given `inputs` directly; hacking so that the cursor source will be our inputs instead of the context namespace
				exports.pipeline.PipelineD.prepareCursorSource(pipelineInst, ctx);

				// run the pipeline against
				pipelineInst.stitch();
			} catch(err) {
				return callback(err);
			}

			var batch = [];
			var runCallback = function aggregated(err, document){
				if (!callback) return;
				if(err) {
					callback(err);
					callback = undefined;//we are officially done. make sure the callback doesn't get called anymore
					return;
				}
				if (document === null){
					callback(null, batch);
					if (batchSize !== Infinity){
						callback(null, null); //this is to tell the caller that that we are done aggregating
					}
					callback = undefined;//we are officially done. make sure the callback doesn't get called anymore
					return;
				}
				batch.push(document);
				if (batch.length >= batchSize){
					callback(null, batch);
					batch = [];
					return;
				}
			};
			pipelineInst.run(runCallback);
			return batch;
		};
	if(inputs) return aggregator(ctx, inputs, callback);
	return aggregator;
};

// sync callback for aggregate if none was provided
exports.SYNC_CALLBACK = function(err, docs){
	if (err) throw err;
	return docs;
};

exports.cmdDefaults = {
	batchSize: 150,
	explain: false
};

// package-style interface; i.e., return a function underneath of the require
exports.aggregate = exports;

//Expose these so that mungedb-aggregate can be extended.
exports.pipeline = require("./pipeline/");
exports.query = require("./query/");

// version info
exports.version = "r2.6.5";
exports.gitVersion = "e99d4fcb4279c0279796f237aa92fe3b64560bf6";

// error code constants
exports.ERRORS = require('./Errors.js');
