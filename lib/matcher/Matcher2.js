"use strict";

var errors = require("../errors"),
	ErrorCodes = errors.ErrorCodes,
	MatchExpressionParser = require("./MatchExpressionParser");

/**
 * Matcher2 is a simple wrapper around a JSONObj and the MatchExpression created from it.
 * @class Matcher2
 * @namespace mungedb-aggregate.matcher
 * @module mungedb-aggregate
 * @constructor
 */
var Matcher2 = module.exports = function Matcher2(pattern, nested){
	this._pattern = pattern;
	this.parser = new MatchExpressionParser();
	var result = this.parser.parse(pattern);
	if (result.code !== ErrorCodes.OK)
		return {code:16810, description:"bad query: " + JSON.stringify(result)};
	this._expression = result.result;
}, klass = Matcher2, proto = klass.prototype;

proto._expression = undefined;
proto._pattern = undefined;

/**
 *
 * matches checks the input doc against the internal element path to see if it is a match
 * @method matches
 * @param doc
 * @param details
 *
 */
proto.matches = function matches(doc, details){
	if (!this._expression)
		return true;

	return this._expression.matchesJSON(doc, details);
};

/**
 *
 * Return the _pattern property
 * @method getQuery
 *
 */
proto.getQuery = function getQuery(){
	return this._pattern;
};

/**
 *
 * Convert _pattern into a string
 * @method toString
 *
 */
proto.toString = function toString(){
	return this._pattern.toString();
};
