"use strict";

/**
 * Generates Variables::Ids and keeps track of the number of Ids handed out.
 * @class VariablesIdGenerator
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var VariablesIdGenerator = module.exports = function VariablesIdGenerator(){
	this._nextId = 0;
}, klass = VariablesIdGenerator, proto = klass.prototype;

/**
 * Gets the next unused id
 * @method generateId
 * @return {Number} The unused id
 */
proto.generateId = function generateId() {
	return this._nextId++;
};

/**
 * Returns the number of Ids handed out by this Generator.
 * Return value is intended to be passed to Variables constructor.
 * @method getIdCount
 * @return {Number} The number of used ids
 */
proto.getIdCount = function getIdCount() {
	return this._nextId;
};
