"use strict";
var LeafMatchExpression = require("./LeafMatchExpression"),
	Value = require("../Value"),
	ErrorCodes = require("../../errors").ErrorCodes;

/**
 * ComparisonMatchExpression
 * @class ComparisonMatchExpression
 * @namespace mungedb-aggregate.pipeline.matcher
 * @module mungedb-aggregate
 * @constructor
 */
var ComparisonMatchExpression = module.exports = function ComparisonMatchExpression(type){
	base.call(this);
	this._matchType = type;
}, klass = ComparisonMatchExpression, base = LeafMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

proto._rhs = undefined;

/**
 * Writes a debug string for this object
 * @method debugString
 * @param level
 */
proto.debugString = function debugString(level) {
	var retStr = this._debugAddSpace(level) + this.path() + " ";
	switch (this._matchType) {
		case "LT":
			retStr += "$lt";
			break;
		case "LTE":
			retStr += "$lte";
			break;
		case "EQ":
			retStr += "==";
			break;
		case "GT":
			retStr += "$gt";
			break;
		case "GTE":
			retStr += "$gte";
			break;
		default:
			retStr += "Unknown comparison!";
			break;
	}

	retStr += (this._rhs ? this._rhs.toString() : "?");
	if (this.getTag()) {
		retStr += this.getTag().debugString();
	}
	return retStr + "\n";
};

/**
 * checks if this expression is == to the other
 * @method equivalent
 * @param other
 */
proto.equivalent = function equivalent(other) {
	if (other._matchType !== this._matchType)  return false;
	return this.path() === other.path() && Value.compare(this._rhs,other._rhs) === 0;
};

/**
 * Return the _rhs property
 * @method getData
 */
proto.getData = function getData() {
	return this._rhs;
};

/**
 * Return the _rhs property
 * @method getRHS
 */
proto.getRHS = function getRHS() {
	return this._rhs;
};

/**
 * Initialize the necessary items
 * @method init
 * @param path
 * @param type
 */
proto.init = function init(path, rhs) {
	this._rhs = rhs;

	if (Value.getType(rhs) === "Object" && Object.keys(rhs).length === 0) {
		return {code:ErrorCodes.BAD_VALUE, description:"need a real operand"};
	}

	if (rhs === undefined) {
		return {code:ErrorCodes.BAD_VALUE, description:"cannot compare to undefined"};
	}

	switch (this._matchType) {
		case "LT":
		case "LTE":
		case "EQ":
		case "GT":
		case "GTE":
			break;
		default:
			return {code:ErrorCodes.BAD_VALUE, description:"bad match type for ComparisonMatchExpression"};
	}

	return this.initPath(path);
};

/**
 * Check if the input element matches
 * @method matchesSingleElement
 * @param e
 */
proto.matchesSingleElement = function matchesSingleElement(e) {
	if (Value.canonicalize(e) !== Value.canonicalize(this._rhs)) {
		// some special cases
		//  jstNULL and undefined are treated the same
		if (Value.canonicalize(e) + Value.canonicalize(this._rhs) === 5) {
			return this._matchType === "EQ" || this._matchType === "LTE" || this._matchType === "GTE";
		}

		var rhsType = Value.getType(this._rhs);
		if (rhsType === "MaxKey" || rhsType === "MinKey") {
			return this._matchType !== "EQ";
		}

		return false;
	}

	var x = Value.compare(e, this._rhs);

	switch(this._matchType) {
		case "LT":
			return x < 0;
		case "LTE":
			return x <= 0;
		case "EQ":
			return x === 0;
		case "GT":
			return x > 0;
		case "GTE":
			return x >= 0;
		default:
			throw new Error("Assertion failure: invalid comparison type evaluated; fassert 16828");
	}
};
