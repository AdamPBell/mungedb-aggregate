"use strict";

/**
 * An $millisecond pipeline expression.
 * @class MillisecondExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var MillisecondExpression = module.exports = function MillisecondExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = MillisecondExpression, base = require("./FixedArityExpressionT")(MillisecondExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}}); //jshint ignore:line

var Expression = require("./Expression"),
	Value = require("../Value");

proto.evaluateInternal = function evaluateInternal(vars) {
	var pDate = this.operands[0].evaluateInternal(vars),
		date = Value.coerceToDate(pDate);
	return date.getUTCMilliseconds(); //NOTE: no leap milliseconds in JS - http://code.google.com/p/v8/issues/detail?id=1944
};

proto.getOpName = function getOpName() {
	return "$millisecond";
};

Expression.registerExpression("$millisecond", base.parse);
