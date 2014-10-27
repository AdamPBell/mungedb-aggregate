"use strict";

/**
 * A $not pipeline expression.
 * @see evaluateInternal
 * @class NotExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var NotExpression = module.exports = function NotExpression() {
	this.nargs = 1;
	base.call(this);
}, klass = NotExpression,
	base = require("./NaryExpression"),
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
klass.opName = "$not";
proto.getOpName = function getOpName() {
	return klass.opName;
};

/**
 * Returns the boolean opposite value passed to it. When passed a true value, $not returns false; when passed a false value, $not returns true.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var op = this.operands[0].evaluateInternal(vars);
	return !Value.coerceToBool(op);
};

/** Register Expression */
Expression.registerExpression(klass.opName, base.parse);
