"use strict";

/**
 * Create an expression that finds the sum of n operands.
 * @class AddToSetAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 */
var AddToSetAccumulator = module.exports = function AddToSetAccumulator() {
	if (arguments.length !== 0) throw new Error("zero args expected");
	this.reset();
	base.call(this);
}, klass = AddToSetAccumulator, Accumulator = require("./Accumulator"), base = Accumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var ValueSet = require("../ValueSet");

proto.processInternal = function processInternal(input, merging) {
	if (!merging) {
		if (input !== undefined) {
			this.set.insert(input);
		}
	} else {
		// If we're merging, we need to take apart the arrays we
		// receive and put their elements into the array we are collecting.
		// If we didn't, then we'd get an array of arrays, with one array
		// from each merge source.
		if (!Array.isArray(input)) throw new Error("Assertion failure");

		for (var i = 0, l = input.length; i < l; i++) {
			this.set.insert(input[i]);
		}
	}
};

proto.getValue = function getValue(toBeMerged) { //jshint ignore:line
	return this.set.values();
};

proto.reset = function reset() {
	this.set = new ValueSet();
};

klass.create = function create() {
	return new AddToSetAccumulator();
};

proto.getOpName = function getOpName() {
	return "$addToSet";
};
