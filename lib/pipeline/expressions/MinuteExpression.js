"use strict";

/**
 * An $minute pipeline expression.
 * @see evaluateInternal
 * @class MinuteExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var MinuteExpression = module.exports = function MinuteExpression() {
	this.nargs = 1;
	base.call(this);
}, klass = MinuteExpression,
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
	return "$minute";
};

/**
 * Takes a date and returns the minute between 0 and 59.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var date = this.operands[0].evaluateInternal(vars);
	return date.getUTCMinutes();
};

/** Register Expression */
Expression.registerExpression("$minute", base.parse(MinuteExpression));
