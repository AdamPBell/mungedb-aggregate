"use strict";

/**
 * An $hour pipeline expression.
 * @class HourExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var HourExpression = module.exports = function HourExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = HourExpression, base = require("./FixedArityExpressionT")(HourExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

var Expression = require("./Expression"),
	Value = require("../Value");

proto.evaluateInternal = function evaluateInternal(vars) {
	var pDate = this.operands[0].evaluateInternal(vars),
		date = Value.coerceToDate(pDate);
	return date.getUTCHours();
};

proto.getOpName = function getOpName() {
	return "$hour";
};

Expression.registerExpression("$hour", base.parse);
