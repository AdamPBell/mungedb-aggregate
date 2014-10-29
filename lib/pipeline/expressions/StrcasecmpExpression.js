"use strict";

/**
 * A $strcasecmp pipeline expression.
 * @see evaluate
 * @class StrcasecmpExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var StrcasecmpExpression = module.exports = function StrcasecmpExpression() {
	base.call(this);
}, klass = StrcasecmpExpression,
	FixedArityExpression = require("./FixedArityExpressionT")(klass, 2),
	base = FixedArityExpression,
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});

// DEPENDENCIES
var Value = require("../Value"),
	NaryExpression = require("./NaryExpression"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$strcasecmp";
};

/**
 * Takes in two strings. Returns a number. $strcasecmp is positive if the first string is “greater than” the second and negative if the first string is “less than” the second. $strcasecmp returns 0 if the strings are identical.
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var val1 = this.operands[0].evaluateInternal(vars),
		val2 = this.operands[1].evaluateInternal(vars),
		str1 = Value.coerceToString(val1).toUpperCase(),
		str2 = Value.coerceToString(val2).toUpperCase(),
		cmp = Value.compare(str1, str2);
	return cmp;
};

/** Register Expression */
Expression.registerExpression("$strcasecmp", base.parse);
