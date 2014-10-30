"use strict";

/** 
 * Accumulator for summing a field across documents
 * @class SumAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var SumAccumulator = module.exports = function SumAccumulator(){
	this.total = 0;
	this.count = 0;
	this.totalIsANumber = true;
	base.call(this);
}, klass = SumAccumulator, Accumulator = require("./Accumulator"), base = Accumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// NOTE: Skipping the create function, using the constructor instead

// MEMBER FUNCTIONS
proto.processInternal = function processInternal(input, merging) {
	if(typeof input === "number"){ // do nothing with non-numeric types
		this.totalIsANumber = true;
		this.total += input;
	}
	this.count++;

	return 0;
};

proto.getValue = function getValue(toBeMerged){
	if (this.totalIsANumber) {
		return this.total;
	}
	throw new Error("$sum resulted in a non-numeric type");
};

proto.getOpName = function getOpName(){
	return "$sum";
};
