"use strict";

/**
 * Constructor for MinMaxAccumulator, wraps SingleValueAccumulator's constructor and adds flag to track whether we have started or not
 * @class MinMaxAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var MinMaxAccumulator = module.exports = function MinMaxAccumulator(sense){
	if (arguments.length > 1) throw new Error("expects a single value");
	base.call(this);
	this.sense = sense; /* 1 for min, -1 for max; used to "scale" comparison */
	if (this.sense !== 1 && this.sense !== -1) throw new Error("this should never happen");
}, klass = MinMaxAccumulator, base = require("./Accumulator"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// NOTE: Skipping the create function, using the constructor instead

// DEPENDENCIES
var Value = require("../Value");

// MEMBER FUNCTIONS
proto.getOpName = function getOpName(){
	if (this.sense == 1) return "$min";
	return "$max";
};

klass.createMin = function createMin(){
	return new MinMaxAccumulator(1);
};

klass.createMax = function createMax(){
	return new MinMaxAccumulator(-1);
};

proto.reset = function reset() {
	this.value = undefined;
};

proto.getValue = function getValue(toBeMerged) {
	return this.value;
};

proto.processInternal = function processInternal(input, merging) {
	// if this is the first value, just use it
	if (!this.hasOwnProperty('value')) {
		this.value = input;
	} else {
		// compare with the current value; swap if appropriate
		var cmp = Value.compare(this.value, input) * this.sense;
		if (cmp > 0) this.value = input;
	}

	return this.value;
};
