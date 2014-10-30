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
	base.call(this);
}, klass = SubtractExpression,
	FixedArityExpression = require("./FixedArityExpressionT")(klass, 2),
	base = FixedArityExpression,
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
	if (typeof left === 'number' && typeof right === 'number') {
		return left - right;
	}
	//NOTE: DEVIATION FROM MONGO: inlined left.nullish() || right.nullish()
	else if (left === null || left === undefined || right === null || right === undefined) {
		return null;
	}
	else if (left instanceof Date) {
		if (right instanceof Date) {
			return left - right;
		}
		else if (typeof right === 'number') {
			var millisSinceEpoch = left - right;
			return new Date(millisSinceEpoch);
		} else {
			throw new Error("uassert 16613: " +
				"can't $subtract a " +
				typeof right +
				" from a Date");
		}
	}
	else {
		throw new Error("uassert 16556: " +
			"can't $subtract a " +
			typeof right +
			" from a " +
			typeof left);
	}
	if (left instanceof Date || right instanceof Date) throw new Error("$subtract does not support dates; code 16376");
	return left - right;
};

/** Register Expression */
Expression.registerExpression("$subtract", base.parse);
