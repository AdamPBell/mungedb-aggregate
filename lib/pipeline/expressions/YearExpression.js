"use strict";

/**
 * A $year pipeline expression.
 * @class YearExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var YearExpression = module.exports = function YearExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = YearExpression, base = require("./FixedArityExpressionT")(YearExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var pDate = this.operands[0].evaluateInternal(vars),
		date = Value.coerceToDate(pDate);
	return date.getUTCFullYear();
};

proto.getOpName = function getOpName() {
	return "$year";
};

Expression.registerExpression("$year", base.parse);
