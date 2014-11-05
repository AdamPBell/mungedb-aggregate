"use strict";

/**
 * Accumulator to get the min or max value
 * @class MinMaxAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var MinMaxAccumulator = module.exports = function MinMaxAccumulator(theSense){
	if (arguments.length != 1) throw new Error("expects a single value");
	this._sense = theSense; // 1 for min, -1 for max; used to "scale" comparison
	base.call(this);
	if (this._sense !== 1 && this._sense !== -1) throw new Error("Assertion failure");
}, klass = MinMaxAccumulator, base = require("./Accumulator"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("../Value");

proto.processInternal = function processInternal(input, merging) {
	// nullish values should have no impact on result
	if (!(input === undefined || input === null)) {
		// compare with the current value; swap if appropriate
		var cmp = Value.compare(this._val, input) * this._sense;
		if (cmp > 0 || this._val === undefined) { // missing is lower than all other values
			this._val = input;
		}
	}
};

proto.getValue = function getValue(toBeMerged) {
	return this._val;
};

proto.reset = function reset() {
	this._val = undefined;
};

klass.createMin = function createMin(){
	return new MinMaxAccumulator(1);
};

klass.createMax = function createMax(){
	return new MinMaxAccumulator(-1);
};

proto.getOpName = function getOpName() {
	if (this._sense == 1) return "$min";
	return "$max";
};
