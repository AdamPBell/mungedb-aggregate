"use strict";

/**
 * Constructor for PushAccumulator. Pushes items onto an array.
 * @class PushAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var PushAccumulator = module.exports = function PushAccumulator(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	this.values = [];
	base.call(this);
}, klass = PushAccumulator, Accumulator = require("./Accumulator"), base = Accumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

proto.processInternal = function processInternal(input, merging) {
	if (!merging) {
		if (input !== undefined) {
			this.values.push(input);
		}
	} else {
		// If we're merging, we need to take apart the arrays we
		// receive and put their elements into the array we are collecting.
		// If we didn't, then we'd get an array of arrays, with one array
		// from each merge source.
		if (!Array.isArray(input)) throw new Error("Assertion failure");

		Array.prototype.push.apply(this.values, input);
	}
};

proto.getValue = function getValue(toBeMerged) {
	return this.values;
};

proto.reset = function reset() {
	this.values = [];
};

klass.create = function create() {
	return new PushAccumulator();
};

proto.getOpName = function getOpName() {
	return "$push";
};
