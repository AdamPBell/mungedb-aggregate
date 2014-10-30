"use strict";

/**
 * A $substr pipeline expression.
 * @see evaluateInternal
 * @class SubstrExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SubstrExpression = module.exports = function SubstrExpression() {
	base.call(this);
}, klass = SubstrExpression,
	FixedArityExpression = require("./FixedArityExpressionT")(klass, 3),
	base = FixedArityExpression,
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$substr";
};

/**
 * Takes a string and two numbers. The first number represents the number of bytes in the string to skip, and the second number specifies the number of bytes to return from the string.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var val = this.operands[0].evaluateInternal(vars),
		idx = this.operands[1].evaluateInternal(vars),
		len = this.operands[2].evaluateInternal(vars),
		str = Value.coerceToString(val);
	if (typeof(idx) != "number") throw new Error(this.getOpName() + ": starting index must be a numeric type; code 16034");
	if (typeof(len) != "number") throw new Error(this.getOpName() + ": length must be a numeric type; code 16035");
	if (idx >= str.length) return "";
	//TODO: Need to handle -1
	len = (len === -1 ? undefined : len);
	return str.substr(idx, len);
};

/** Register Expression */
Expression.registerExpression("$substr", base.parse);
