"use strict";

/**
 * A $month pipeline expression.
 * @see evaluate
 * @class MonthExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var MonthExpression = module.exports = function MonthExpression() {
	base.call(this);
}, klass = MonthExpression, FixedArityExpression = require("./FixedArityExpressionT")(klass, 1), base = FixedArityExpression, proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});

// DEPENDENCIES
var Expression = require("./Expression");

// STATIC METHODS
klass.opName = "$month";

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return klass.opName;
};

/**
 * Takes a date and returns the month as a number between 1 and 12.
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var date = this.operands[0].evaluateInternal(vars);
	return date.getUTCMonth() + 1;
};

/** Register Expression */
Expression.registerExpression(klass.opName, base.parse);
