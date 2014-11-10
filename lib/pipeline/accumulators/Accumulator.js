"use strict";

/**
 * A base class for all pipeline accumulators.
 * @class Accumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var Accumulator = module.exports = function Accumulator(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = Accumulator, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

/** Process input and update internal state.
 *  merging should be true when processing outputs from getValue(true).
 *  @method process
 *  @param input {Value}
 *  @param merging {Boolean}
 */
proto.process = function process(input, merging) {
	this.processInternal(input, merging);
};

/** Marks the end of the evaluate() phase and return accumulated result.
 *  toBeMerged should be true when the outputs will be merged by process().
 *  @method getValue
 *  @param toBeMerged {Boolean}
 *  @return {Value}
 */
proto.getValue = function getValue(toBeMerged) {
	throw new Error("You need to define this function on your accumulator");
};

/**
 * The name of the op as used in a serialization of the pipeline.
 * @method getOpName
 * @return {String}
 */
proto.getOpName = function getOpName() {
	throw new Error("You need to define this function on your accumulator");
};

//NOTE: DEVIATION FROM MONGO: not implementing this
//int memUsageForSorter() const {}

/**
 * Reset this accumulator to a fresh state ready to receive input.
 * @method reset
 */
proto.reset = function reset() {
	throw new Error("You need to define this function on your accumulator");
};

/**
 * Update subclass's internal state based on input
 * @method processInternal
 * @param input {Value}
 * @param merging {Boolean}
 */
proto.processInternal = function processInternal(input, merging) {
	throw new Error("You need to define this function on your accumulator");
};

//NOTE: DEVIATION FROM MONGO: not implementing this
// /// subclasses are expected to update this as necessary
// int _memUsageBytes;
