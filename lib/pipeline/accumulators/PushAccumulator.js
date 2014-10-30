"use strict";

/**
 * Constructor for PushAccumulator. Pushes items onto an array.
 * @class PushAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var PushAccumulator = module.exports = function PushAccumulator(){
	this.values = [];
	base.call(this);
}, klass = PushAccumulator, Accumulator = require("./Accumulator"), base = Accumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// NOTE: Skipping the create function, using the constructor instead

// MEMBER FUNCTIONS
proto.getValue = function getValue(toBeMerged){
	return this.values;
};

proto.getOpName = function getOpName(){
	return "$push";
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};


proto.processInternal = function processInternal(input, merging) {
	if (!merging) {
		if (input !== undefined) {
			this.values.push(input);
			//_memUsageBytes += input.getApproximateSize();
		}
	}
	else {
		// If we're merging, we need to take apart the arrays we
		// receive and put their elements into the array we are collecting.
		// If we didn't, then we'd get an array of arrays, with one array
		// from each merge source.
		if (!(input instanceof Array)) throw new Error("input is not an Array during merge in PushAccumulator:35");

		this.values = this.values.concat(input);

		//for (size_t i=0; i < vec.size(); i++) {
			//_memUsageBytes += vec[i].getApproximateSize();
		//}
	}
};
