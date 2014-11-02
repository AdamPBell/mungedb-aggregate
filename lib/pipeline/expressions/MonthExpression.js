"use strict";

/**
 * A $month pipeline expression.
 * @class MonthExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var MonthExpression = module.exports = function MonthExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = MonthExpression, base = require("./FixedArityExpressionT")(MonthExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});

var Expression = require("./Expression"),
	Value = require("../Value");

proto.evaluateInternal = function evaluateInternal(vars) {
	var pDate = this.operands[0].evaluateInternal(vars),
		date = Value.coerceToDate(pDate);
	return date.getUTCMonth() + 1;
};

proto.getOpName = function getOpName() {
	return "$month";
};

Expression.registerExpression("$month", base.parse);
