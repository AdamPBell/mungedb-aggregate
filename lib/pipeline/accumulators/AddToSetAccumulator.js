"use strict";

/**
 * Create an expression that finds the sum of n operands.
 * @class AddToSetAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
**/
var AddToSetAccumulator = module.exports = function AddToSetAccumulator(/* ctx */){
	if (arguments.length !== 0) throw new Error("zero args expected");
	this.set = [];
	//this.itr = undefined; /* Shoudln't need an iterator for the set */
	//this.ctx = undefined; /* Not using the context object currently as it is related to sharding */
	base.call(this);
}, klass = AddToSetAccumulator, Accumulator = require("./Accumulator"), base = Accumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// NOTE: Skipping the create function, using the constructor instead

// DEPENDENCIES
var Value = require("../Value");


// MEMBER FUNCTIONS

proto.getOpName = function getOpName(){
	return "$addToSet";
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};


proto.contains = function contains(value) {
	var set = this.set;
	for (var i = 0, l = set.length; i < l; ++i) {
		if (Value.compare(set[i], value) === 0) {
			return true;
		}
	}
	return false;
};

proto.processInternal = function processInternal(input, merging) {
	if (! this.contains(input)) {
		this.set.push(input);
	}
};

proto.getValue = function getValue(toBeMerged) {
	return this.set;
};

proto.reset = function reset() {
	this.set = [];
};


