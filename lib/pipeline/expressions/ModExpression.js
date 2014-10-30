"use strict";

/**
 * An $mod pipeline expression.
 * @see evaluate
 * @class ModExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var ModExpression = module.exports = function ModExpression() {
	base.call(this);
}, klass = ModExpression,
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
proto.getOpName = function getOpName() {
	return "$mod";
};

/**
 * Takes an array that contains a pair of numbers and returns the remainder of the first number divided by the second number.
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	this.checkArgCount(2);
	var left = this.operands[0].evaluateInternal(vars),
		right = this.operands[1].evaluateInternal(vars);
	if (left instanceof Date || right instanceof Date) throw new Error("$mod does not support dates; code 16374");

	// pass along jstNULLs and Undefineds
	if (left === undefined || left === null) return left;
	if (right === undefined || right === null) return right;

	// ensure we aren't modding by 0
	right = Value.coerceToDouble(right);
	if (right === 0) return undefined;

	left = Value.coerceToDouble(left);
	return left % right;
};

/** Register Expression */
Expression.registerExpression("$mod", base.parse);
