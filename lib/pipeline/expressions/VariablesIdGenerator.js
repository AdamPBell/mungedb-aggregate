"use strict";

/** 
 * Class generates unused ids
 * @class VariablesIdGenerator
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var VariablesIdGenerator = module.exports = function VariablesIdGenerator(){
	this._nextId = 0;
}, klass = VariablesIdGenerator, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

/**
 * Gets the next unused id
 * @method generateId
 * @return {Number} The unused id
 **/
proto.generateId = function generateId() {
	return this._nextId++;
};

/**
 * Gets the number of used ids
 * @method getIdCount
 * @return {Number} The number of used ids
 **/
proto.getIdCount = function getIdCount() {
	return this._nextId;
};

