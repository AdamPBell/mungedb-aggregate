"use strict";

/**
 * An $second pipeline expression.
 * @class SecondExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var SecondExpression = module.exports = function SecondExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = SecondExpression, base = require("./FixedArityExpressionT")(SecondExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});

var Expression = require("./Expression"),
	Value = require("../Value");

proto.evaluateInternal = function evaluateInternal(vars) {
	var pDate = this.operands[0].evaluateInternal(vars),
		date = Value.coerceToDate(pDate);
	return date.getUTCSeconds();  //NOTE: no leap seconds in JS - http://code.google.com/p/v8/issues/detail?id=1944
};

proto.getOpName = function getOpName() {
	return "$second";
};

Expression.registerExpression("$second", base.parse);
