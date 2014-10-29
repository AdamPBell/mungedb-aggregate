"use strict";

/**
 * A $not pipeline expression.
 * @see evaluateInternal
 * @class NotExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var NotExpression = module.exports = function NotExpression() {
	base.call(this);
}, klass = NotExpression,
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
	return "$not";
};

/**
 * Returns the boolean opposite value passed to it. When passed a true value, $not returns false; when passed a false value, $not returns true.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var op = this.operands[0].evaluateInternal(vars);
	return !Value.coerceToBool(op);
};

/** Register Expression */
Expression.registerExpression("$not", base.parse);
