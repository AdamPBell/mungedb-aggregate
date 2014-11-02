"use strict";

/**
 * Get the DayOfWeek from a date.
 * @class DayOfWeekExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var DayOfWeekExpression = module.exports = function DayOfWeekExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = DayOfWeekExpression, base = require("./FixedArityExpressionT")(DayOfWeekExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Expression = require("./Expression"),
	Value = require("../Value");

proto.evaluateInternal = function evaluateInternal(vars) {
	var pDate = this.operands[0].evaluateInternal(vars),
		date = Value.coerceToDate(pDate);
	return date.getUTCDay() + 1;
};

proto.getOpName = function getOpName() {
	return "$dayOfWeek";
};

Expression.registerExpression("$dayOfWeek", base.parse);
