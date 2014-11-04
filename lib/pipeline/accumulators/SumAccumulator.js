"use strict";

/**
 * Accumulator for summing values
 * @class SumAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var SumAccumulator = module.exports = function SumAccumulator() {
	if (arguments.length !== 0) throw new Error("zero args expected");
	this.reset();
	base.call(this);
}, klass = SumAccumulator, base = require("./Accumulator"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

proto.processInternal = function processInternal(input, merging) {
	// do nothing with non numeric types
	if (typeof input !== "number"){
		if (input !== undefined && input !== null) { //NOTE: DEVIATION FROM MONGO: minor fix for 0-like values
			this.isNumber = false;
		}
		return;
	}
	this.total += input;
};

klass.create = function create() {
	return new SumAccumulator();
};

proto.getValue = function getValue(toBeMerged) {
	if (this.isNumber) {
		return this.total;
	} else {
		throw new Error("$sum resulted in a non-numeric type; massert code 16000");
	}
};

proto.reset = function reset() {
	this.isNumber = true;
	this.total = 0;
};

proto.getOpName = function getOpName(){
	return "$sum";
};
