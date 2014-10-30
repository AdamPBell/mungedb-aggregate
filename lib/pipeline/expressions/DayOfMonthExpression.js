"use strict";

/**
 * Get the DayOfMonth from a date.
 * @class DayOfMonthExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var DayOfMonthExpression = module.exports = function DayOfMonthExpression() {
    this.nargs = 1;
    base.call(this);
}, klass = DayOfMonthExpression,
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
    return "$dayOfMonth";
};

/**
 * Takes a date and returns the day of the month as a number between 1 and 31.
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
    var date = this.operands[0].evaluateInternal(vars);
    return date.getUTCDate();
};

/** Register Expression */
Expression.registerExpression("$dayOfMonth", base.parse(DayOfMonthExpression));
