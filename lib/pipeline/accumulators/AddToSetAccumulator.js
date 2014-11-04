"use strict";

/**
 * Create an expression that finds the sum of n operands.
 * @class AddToSetAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
**/
var AddToSetAccumulator = module.exports = function AddToSetAccumulator(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	this.reset();
	base.call(this);
}, klass = AddToSetAccumulator, Accumulator = require("./Accumulator"), base = Accumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("../Value");

proto.processInternal = function processInternal(input, merging) {
	if (!merging) {
		if (input !== undefined) {
			this.set[JSON.stringify(input)] = input;
		}
	} else {
		// If we're merging, we need to take apart the arrays we
		// receive and put their elements into the array we are collecting.
		// If we didn't, then we'd get an array of arrays, with one array
		// from each merge source.
		if (!Array.isArray(input)) throw new Error("Assertion failure");

		for (var i = 0, l = input.length; i < l; i++) {
			this.set[JSON.stringify(input[i])] = input[i];
		}
	}
};

proto.getValue = function getValue(toBeMerged) {
	var results = [];
	for(var key in this.set){
		// if(!Object.hasOwnProperty(this.set))
		results.push(this.set[key]);
	}
	return results;
};

proto.reset = function reset() {
	this.set = {};
};

klass.create = function create() {
	return new AddToSetAccumulator();
};

proto.getOpName = function getOpName() {
	return "$addToSet";
};
