"use strict";

/** 
 * Constructor for LastAccumulator, wraps SingleValueAccumulator's constructor and finds the last document
 * @class LastAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var LastAccumulator = module.exports = function LastAccumulator(){
	base.call(this);
	this.value = undefined;
}, klass = LastAccumulator, base = require("./Accumulator"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// NOTE: Skipping the create function, using the constructor instead

// MEMBER FUNCTIONS
proto.processInternal = function processInternal(input, merging){
	this.value = input;
};

proto.getValue = function getValue() {
	return this.value;
};

proto.getOpName = function getOpName(){
	return "$last";
};

proto.reset = function reset() {
	this.value = undefined;
};
