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
	base.call(this);
}, klass = AvgAccumulator, SumAccumulator = require("./SumAccumulator"), base = SumAccumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

proto.getValue = function getValue(){
	if (this.totalIsANumber && this.count > 0) {
		return this.total / this.count;
	} else if (this.count === 0) {
		return 0;
	} else {
		throw new Error("$sum resulted in a non-numeric type");
	}
};

proto.getOpName = function getOpName(){
	return "$avg";
};
