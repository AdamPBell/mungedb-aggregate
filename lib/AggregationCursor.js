/**
 * AggregationCursor provides an interface to pipeline results.
 * @class AggregationCursor
 * @namespace mungedb-aggregate
 * @module mungedb-aggregate
 * @constructor
 * @param pipelineInst An instance of a pipeline to be run
 */
var AggregationCursor = module.exports = function(pipelineInst) {
	this.pipelineInst = pipelineInst;
}, klass = AggregationCursor, proto = klass.prototype;

/**
 * Return an array of pipeline results
 *
 * Runs "synchronously" if no callback is given.
 * @method toArray
 * @param  {Function} callback If null, run synchronously
 * @return {Array} documents (when no callback is provided)
 */
proto.toArray = function(callback) {
	var batch = [],
		isAsync = typeof callback === "function";
	if(!isAsync) return this.pipelineInst.run().result;
	this.pipelineInst.run(isAsync, function(err, doc) {
		if (err) if (callback) return callback(err); else throw err;
		if (doc !== null) return batch.push(doc);
		if (callback) return callback(null, batch);
	});
	if (!callback) return batch;
};

/**
 * Run a function on each document result and a callback at the end of the stream.
 * @method forEach
 * @param  {function}   iterator Function to be run on each $document
 * @param  {Function} callback Function run when aggregation is finished
 */
proto.forEach = function(iterator, callback) {
	this.pipelineInst.run(function(err, doc) {
		if (err || doc === null) return callback(err);
		iterator(doc);
	});
};

/**
 * Run a function on each document getting a null to signify EOF.
 * @method each
 * @param  {Function} callback Run for each document until EOF
 */
proto.each = function(callback) {
	this.pipelineInst.run(callback);
};
