"use strict";

/**
 * An $ifNull pipeline expression.
 * @see evaluate
 * @class IfNullExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var IfNullExpression = module.exports = function IfNullExpression() {
	this.nargs = 2;
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = IfNullExpression,
	base = require("./NaryExpression"),
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});

// DEPENDENCIES
var Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$ifNull";
};

// virtuals from ExpressionNary

/**
 * Use the $ifNull operator with the following syntax: { $ifNull: [ <expression>, <replacement-if-null> ] }
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var left = this.operands[0].evaluateInternal(vars);
	if (left !== undefined && left !== null) return left;
	var right = this.operands[1].evaluateInternal(vars);
	return right;
};

/** Register Expression */
Expression.registerExpression("$ifNull", base.parse(IfNullExpression));
