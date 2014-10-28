"use strict";

/**
 * Matcher is a simple wrapper around a JSONObj and the MatchExpression created from it.
 * @class Matcher
 * @namespace mungedb-aggregate.pipeline.matcher
 * @module mungedb-aggregate
 * @constructor
 */
var Matcher = module.exports = function Matcher(pattern, whereCallback){
	this._pattern = pattern;
	this.parser = new MatchExpressionParser();
	var result = this.parser.parse(pattern);
	if (result.code != ErrorCodes.OK)
		return {code:16810, description:"bad query: " + result};
	this._expression = result.result;
}, klass = Matcher, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var errors = require("../../Errors.js"),
	ErrorCodes = errors.ErrorCodes,
	MatchExpressionParser = require("./MatchExpressionParser.js"),

//PROTOTYPE MEMBERS
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

	if ((doc != {}) && (Object.keys(doc)[0]))
		return this._expression.matchesBSON(doc, details);

	return this._expression.matches(mydoc, details);
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
