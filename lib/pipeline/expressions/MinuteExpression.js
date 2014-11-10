"use strict";

/**
 * An $minute pipeline expression.
 * @class MinuteExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var MinuteExpression = module.exports = function MinuteExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = MinuteExpression, base = require("./FixedArityExpressionT")(MinuteExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}}); //jshint ignore:line

var Expression = require("./Expression"),
	Value = require("../Value");

proto.evaluateInternal = function evaluateInternal(vars) {
	var pDate = this.operands[0].evaluateInternal(vars),
		date = Value.coerceToDate(pDate);
	return date.getUTCMinutes();
};

proto.getOpName = function getOpName() {
	return "$minute";
};

Expression.registerExpression("$minute", base.parse);
