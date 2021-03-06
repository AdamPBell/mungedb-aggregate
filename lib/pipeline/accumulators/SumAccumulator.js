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

proto.evaluate = function evaluate(doc){
	if (this.operands.length != 1) throw new Error("this should never happen");
	var v = this.operands[0].evaluate(doc);

	if (typeof v !== "number") { // do nothing with non-numeric types
		return 0;
	} else {
		this.totalIsANumber = true;
		this.total += v;
	}
	this.count++;

	return 0;
};

proto.getValue = function getValue(){
	if (this.totalIsANumber) {
		return this.total;
	}
	throw new Error("$sum resulted in a non-numeric type");
};

proto.getOpName = function getOpName(){
	return "$sum";
};
