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
	this.reset();
	base.call(this);
}, klass = FirstAccumulator, base = require("./Accumulator"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

proto.processInternal = function processInternal(input, merging) {
	// only remember the first value seen
	if (!this._haveFirst) {
		this._haveFirst = true;
		this._first = input;
	}
};

proto.getValue = function getValue(toBeMerged) {
	return this._first;
};

proto.reset = function reset() {
	this._haveFirst = false;
	this._first = undefined;
};

klass.create = function create() {
	return new FirstAccumulator();
};

proto.getOpName = function getOpName() {
	return "$first";
};
