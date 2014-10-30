"use strict";

/**
 * A class for constructing accumulators to calculate avg.
 * @class AvgAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var AvgAccumulator = module.exports = function AvgAccumulator(){
	this.subTotalName = "subTotal";
	this.countName = "count";
	this.totalIsANumber = true;
	this.total = 0;
	this.count = 0;
	base.call(this);
}, klass = AvgAccumulator, Accumulator = require("./Accumulator"), base = Accumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// NOTE: Skipping the create function, using the constructor instead

// DEPENDENCIES
var Value = require("../Value");

// MEMBER FUNCTIONS
proto.processInternal = function processInternal(input, merging) {
	if (!merging) {
		if (typeof input !== "number") {
			return;
		}
		this.total += input;
		this.count += 1;
	} else {
		Value.verifyDocument(input);
		this.total += input[this.subTotalName];
		this.count += input[this.countName];
	}
};

proto.getValue = function getValue(toBeMerged){
	if (!toBeMerged) {
		if (this.totalIsANumber && this.count > 0) {
			return this.total / this.count;
		} else if (this.count === 0) {
			return 0;
		} else {
			throw new Error("$sum resulted in a non-numeric type");
		}
	} else {
		var ret = {};
		ret[this.subTotalName] = this.total;
		ret[this.countName] = this.count;

		return ret;
	}
};

proto.reset = function reset() {
	this.total = 0;
	this.count = 0;
};

proto.getOpName = function getOpName(){
	return "$avg";
};
