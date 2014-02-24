"use strict";

/** 
 * A $month pipeline expression.
 * @see evaluate
 * @class MonthExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var MonthExpression = module.exports = function MonthExpression() {
		this.fixedArity(1);
		if (arguments.length !== 1) throw new Error("one arg expected");
		base.call(this);
}, klass = MonthExpression,
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
		return "$month";
};

/**
 * Takes a date and returns the month as a number between 1 and 12.
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
		var date = this.operands[0].evaluateInternal(vars);
		return date.getUTCMonth();
};

/** Register Expression */
Expression.registerExpression("$month", klass.parse(MonthExpression));