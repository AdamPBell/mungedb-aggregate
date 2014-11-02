"use strict";

/**
 * Get the DayOfMonth from a date.
 * @class DayOfMonthExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var DayOfMonthExpression = module.exports = function DayOfMonthExpression() {
    if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
    base.call(this);
}, klass = DayOfMonthExpression, base = require("./FixedArityExpressionT")(klass, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});

var Expression = require("./Expression"),
	Value = require("../Value");

proto.evaluateInternal = function evaluateInternal(vars) {
	var pDate = this.operands[0].evaluateInternal(vars),
		date = Value.coerceToDate(pDate);
	return date.getUTCDate();
};

proto.getOpName = function getOpName() {
	return "$dayOfMonth";
};

Expression.registerExpression("$dayOfMonth", base.parse);
