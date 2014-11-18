"use strict";

/**
 * A match expression that always returns false
 * @class FalseMatchExpression
 * @namespace mungedb-aggregate.matcher
 * @module mungedb-aggregate
 * @constructor
 **/
 var FalseMatchExpression = module.exports = function FalseMatchExpression(){
	base.call(this);
	this._matchType = "ALWAYS_FALSE";
}, klass = FalseMatchExpression, base = require("./MatchExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString(level) {
	return this._debugAddSpace( level ) + "$false\n";
};

/**
 *
 * checks if this expression is == to the other
 * @method equivalent
 * @param other
 *
 */
proto.equivalent = function equivalent(other) {
	return other._matchType === this._matchType;
};

/**
 *
 * matches checks the input doc against the internal element path to see if it is a match
 * @method matches
 * @param doc
 * @param details
 *
 */
proto.matches = function matches(doc,details) {
	return false;
};

/**
 *
 * Check if the input element matches
 * @method matchesSingleElement
 * @param e
 *
 */
proto.matchesSingleElement = function matchesSingleElement(e) {
	return false;
};

/**
 *
 * clone this instance to a new one
 * @method shallowClone
 *
 */
proto.shallowClone = function shallowClone(){
	return new FalseMatchExpression();
};

/**
 *
 * append to JSON object
 * @method shallowClone
 *
 */
proto.toJson = function toJson(out){
	out.$false = 1;
	return out;
};
