"use strict";

/**
 * A $toLower pipeline expression.
 * @see evaluateInternal
 * @class ToLowerExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var ToLowerExpression = module.exports = function ToLowerExpression(){
	if (arguments.length !== 0) throw new Error(klass.name + ": args expected: value");
	base.call(this);
}, klass = ToLowerExpression, base = require("./FixedArityExpressionT")(ToLowerExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression");

klass.opName = "$toLower";

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return klass.opName;
};

/**
* Takes a single string and converts that string to lowercase, returning the result. All uppercase letters become lowercase.
**/
proto.evaluateInternal = function evaluateInternal(vars) {
	var val = this.operands[0].evaluateInternal(vars),
		str = Value.coerceToString(val);
	return str.toLowerCase();
};

/** Register Expression */
Expression.registerExpression(klass.opName, base.parse);
