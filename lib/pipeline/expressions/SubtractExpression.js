"use strict";

/**
 * A $subtract pipeline expression.
 * @see evaluateInternal
 * @class SubtractExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SubtractExpression = module.exports = function SubtractExpression(){
	this.nargs = 2;
	base.call(this);
}, klass = SubtractExpression,
	base = require("./NaryExpression"),
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$subtract";
};

/**
* Takes an array that contains a pair of numbers and subtracts the second from the first, returning their difference.
**/
proto.evaluateInternal = function evaluateInternal(vars) {
	var left = this.operands[0].evaluateInternal(vars),
		right = this.operands[1].evaluateInternal(vars);
	if (left instanceof Date || right instanceof Date) throw new Error("$subtract does not support dates; code 16376");
	return left - right;
};

/** Register Expression */
Expression.registerExpression("$subtract", base.parse(SubtractExpression));
