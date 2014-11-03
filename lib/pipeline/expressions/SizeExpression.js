"use strict";

/**
 * A $size pipeline expression.
 * @see evaluateInternal
 * @class SizeExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @extends mungedb-aggregate.pipeline.FixedArityExpressionT
 * @constructor
 */
var SizeExpression = module.exports = function SizeExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": args expected: value");
	base.call(this);
}, klass = SizeExpression, base = require("./FixedArityExpressionT")(SizeExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var array = this.operands[0].evaluateInternal(vars);
	if (!(array instanceof Array)) throw new Error("The argument to $size must be an Array but was of type" + Value.getType(array) + "; uassert code 16376");
	return array.length;
};

Expression.registerExpression("$size", base.parse);

proto.getOpName = function getOpName() {
	return "$size";
};
