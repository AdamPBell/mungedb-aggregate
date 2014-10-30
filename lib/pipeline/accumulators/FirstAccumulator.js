"use strict";

/**
 * Constructor for FirstAccumulator, wraps Accumulator and adds flag to track whether we have started or not
 * @class FirstAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var FirstAccumulator = module.exports = function FirstAccumulator(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
	this._haveFirst = false;
	this._first = undefined;
}, klass = FirstAccumulator, base = require("./Accumulator"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// NOTE: Skipping the create function, using the constructor instead

// MEMBER FUNCTIONS
proto.getOpName = function getOpName(){
	return "$first";
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};


proto.processInternal = function processInternal(input, merging) {
	/* only remember the first value seen */
	if (!this._haveFirst) {
		// can't use pValue.missing() since we want the first value even if missing
		this._haveFirst = true;
		this._first = input;
		//this._memUsageBytes = sizeof(*this) + input.getApproximateSize() - sizeof(Value);
	}
};

proto.getValue = function getValue(toBeMerged) {
	return this._first;
};

proto.reset = function reset() {
	this._haveFirst = false;
	this._first = undefined;
	this._memUsageBytes = 0;
};
