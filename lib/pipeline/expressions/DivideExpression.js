"use strict";

/**
 * A $divide pipeline expression.
 * @see evaluateInternal
 * @class DivideExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var DivideExpression = module.exports = function DivideExpression(){
    this.nargs = 2;
    base.call(this);
}, klass = DivideExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){ //TODO: try to move this to a static and/or instance field instead of a getter function
	return "$divide";
};

/**
 * Takes an array that contains a pair of numbers and returns the value of the first number divided by the second number.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var left = this.operands[0].evaluateInternal(vars),
		right = this.operands[1].evaluateInternal(vars);
	if (!(left instanceof Date) && (!right instanceof Date)) throw new Error("$divide does not support dates; code 16373");
	right = Value.coerceToDouble(right);
	if (right === 0) return undefined;
	left = Value.coerceToDouble(left);
	return left / right;
};

/** Register Expression */
Expression.registerExpression("$divide",base.parse(DivideExpression));
