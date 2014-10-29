"use strict";

/**
 * A $size pipeline expression.
 * @see evaluateInternal
 * @class SizeExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SizeExpression = module.exports = function SizeExpression() {
	base.call(this);
}, klass = SizeExpression,
	FixedArityExpression = require("./FixedArityExpressionT")(klass, 1),
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
	return "$size";
};

/**
 * Takes an array and return the size.
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var array = this.operands[0].evaluateInternal(vars);
	if (array instanceof Date) throw new Error("$size does not support dates; code 16376");
	return array.length;
};

/** Register Expression */
Expression.registerExpression("$size", base.parse);
