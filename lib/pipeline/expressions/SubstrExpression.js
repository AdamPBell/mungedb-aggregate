"use strict";

/**
 * A $substr pipeline expression.
 * @see evaluateInternal
 * @class SubstrExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var SubstrExpression = module.exports = function SubstrExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = SubstrExpression, base = require("./FixedArityExpressionT")(klass, 3), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var string = this.operands[0].evaluateInternal(vars),
		pLower = this.operands[1].evaluateInternal(vars),
		pLength = this.operands[2].evaluateInternal(vars);

	var str = Value.coerceToString(string);
	if (typeof pLower !== "number") throw new Error(this.getOpName() + ":  starting index must be a numeric type (is type " + Value.getType(pLower) + "); uassert code 16034");
	if (typeof pLength !== "number") throw new Error(this.getOpName() + ":  length must be a numeric type (is type " + Value.getType(pLength) + "); uassert code 16035");

	var lower = Value.coerceToLong(pLower),
		length = Value.coerceToLong(pLength);
	if (lower >= str.length) {
		// If lower > str.length() then string::substr() will throw out_of_range, so return an
		// empty string if lower is not a valid string index.
		return "";
	}
	return str.substr(lower, length);
};

Expression.registerExpression("$substr", base.parse);

proto.getOpName = function getOpName() {
	return "$substr";
};
