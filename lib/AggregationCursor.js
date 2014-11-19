var AggregationCursor = module.exports = function(pipelineInst) {
	this.pipelineInst = pipelineInst;
}, klass = AggregationCursor, proto = klass.prototype;

proto.toArray = function(callback) {
	var batch = [];
	this.pipelineInst.run(function(err, doc) {
		if (err && callback) return callback(err), callback = undefined;
		if (err && !callback) throw err;
		if (doc === null && callback) return callback(null, batch), callback = undefined;
		else if (doc !== null) batch.push(doc);
	});
	if (!callback) return batch;
};

proto.forEach = function(iterator, callback) {
	this.pipelineInst.run(function(err, doc) {
		if (err || doc === null) return callback(err);
		iterator(doc);
	});
};

proto.each = function(callback) {
	this.pipelineInst.run(callback);
};
