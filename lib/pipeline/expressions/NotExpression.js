"use strict";

/**
 * A $not pipeline expression.
 * @see evaluateInternal
 * @class NotExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var NotExpression = module.exports = function NotExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": expected args: NONE");
	base.call(this);
}, klass = NotExpression, base = require("./FixedArityExpressionT")(NotExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var op = this.operands[0].evaluateInternal(vars),
		b = Value.coerceToBool(op);
	return !b;
};

Expression.registerExpression("$not", base.parse);

proto.getOpName = function getOpName() {
	return "$not";
};
