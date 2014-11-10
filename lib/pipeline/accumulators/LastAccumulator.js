"use strict";

/**
 * Accumulator for getting last value
 * @class LastAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var LastAccumulator = module.exports = function LastAccumulator(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	this.reset();
	base.call(this);
}, klass = LastAccumulator, base = require("./Accumulator"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

proto.processInternal = function processInternal(input, merging) {
	// always remember the last value seen
	this._last = input;
};

proto.getValue = function getValue(toBeMerged) {
	return this._last;
};

proto.reset = function reset() {
	this._last = undefined;
};

klass.create = function create() {
	return new LastAccumulator();
};

proto.getOpName = function getOpName(){
	return "$last";
};
