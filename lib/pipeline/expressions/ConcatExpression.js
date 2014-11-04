"use strict";

/**
 * Creates an expression that concatenates a set of string operands.
 * @class ConcatExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var ConcatExpression = module.exports = function ConcatExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = ConcatExpression, base = require("./VariadicExpressionT")(ConcatExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var n = this.operands.length;

	var result = "";
	for (var i = 0; i < n; ++i) {
		var val = this.operands[i].evaluateInternal(vars);

		if (val === undefined || val === null)
			return null;

		if (typeof val !== "string")
			throw new Error(this.getOpName() + " only supports strings, not " +
				Value.getType(val) + "; uassert code 16702");

		result += val;
	}

	return result;
};

Expression.registerExpression("$concat", base.parse);

proto.getOpName = function getOpName(){
	return "$concat";
};
