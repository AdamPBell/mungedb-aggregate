"use strict";

/**
 * A $week pipeline expression.
 * @class WeekExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var WeekExpression = module.exports = function WeekExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = WeekExpression, base = require("./FixedArityExpressionT")(WeekExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}}); //jshint ignore:line

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var pDate = this.operands[0].evaluateInternal(vars),
		date = Value.coerceToDate(pDate),
		//NOTE: DEVIATION FROM MONGO: our calculations are a little different but are equivalent
		y11 = new Date(date.getUTCFullYear(), 0, 1), // same year, first month, first day w/o time
		ymd = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1), // same y,m,d w/o time
		yday = Math.ceil((ymd - y11) / 86400000); // count days
	return (yday / 7) | 0;
};

proto.getOpName = function getOpName() {
	return "$week";
};

Expression.registerExpression("$week", base.parse);
