"use strict";

/**
 * A class for constructing accumulators to calculate avg.
 * @class AvgAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var AvgAccumulator = module.exports = function AvgAccumulator(){
	this.reset();
	base.call(this);
}, klass = AvgAccumulator, Accumulator = require("./Accumulator"), base = Accumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("../Value");

var SUB_TOTAL_NAME = "subTotal";
var COUNT_NAME = "count";

proto.processInternal = function processInternal(input, merging) {
	if (!merging) {
		// non numeric types have no impact on average
		if (typeof input != "number") return;

		this._total += input;
		this._count += 1;
	} else {
		// We expect an object that contains both a subtotal and a count.
		// This is what getValue(true) produced below.
		if (!(input instanceof Object)) throw new Error("Assertion error");
		this._total += input[SUB_TOTAL_NAME];
		this._count += input[COUNT_NAME];
	}
};

klass.create = function create() {
	return new AvgAccumulator();
};

proto.getValue = function getValue(toBeMerged) {
	if (!toBeMerged) {
		if (this._count === 0)
			return 0.0;
		return this._total / this._count;
	} else {
		var doc = {};
		doc[SUB_TOTAL_NAME] = this._total;
		doc[COUNT_NAME] = this._count;
		return doc;
	}
};

proto.reset = function reset() {
	this._total = 0;
	this._count = 0;
};

proto.getOpName = function getOpName() {
	return "$avg";
};
