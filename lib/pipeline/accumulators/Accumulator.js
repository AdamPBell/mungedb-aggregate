"use strict";

/**
 * A base class for all pipeline accumulators. Uses NaryExpression as a base class.
 *
 * @class Accumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var Accumulator = module.exports = function Accumulator(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	this._memUsageBytes = 0;
	base.call(this);
}, klass = Accumulator, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
// var Value = require("../Value"),

proto.memUsageForSorter = function memUsageForSorter() {
	return this._memUsageBytes;
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

/** Process input and update internal state.
 * merging should be true when processing outputs from getValue(true).
 */
proto.process = function process(input, merging){
	this.processInternal(input, merging);
};

proto.toJSON = function toJSON(isExpressionRequired){
	var rep = {};
	rep[this.getOpName()] = this.operands[0].toJSON(isExpressionRequired);
	return rep;
};

/**
 * If this function is not overridden in the sub classes,
 * then throw an error
 *
 **/
proto.getOpName = function getOpName() {
	throw new Error("You need to define this function on your accumulator");
};

/**
 * If this function is not overridden in the sub classes,
 * then throw an error
 *
 **/
proto.getValue = function getValue(toBeMerged) {
	throw new Error("You need to define this function on your accumulator");
};

/**
 * If this function is not overridden in the sub classes,
 * then throw an error
 *
 **/
proto.processInternal = function processInternal(input, merging) {
	throw new Error("You need to define this function on your accumulator");
};

/**
 * If this function is not overridden in the sub classes,
 * then throw an error
 *
 **/
proto.reset = function reset() {
	throw new Error("You need to define this function on your accumulator");
};
