"use strict";

/**
 * A $week pipeline expression.
 * @see evaluateInternal
 * @class WeekExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var WeekExpression = module.exports = function WeekExpression() {
	base.call(this);
}, klass = WeekExpression,
	FixedArityExpression = require("./FixedArityExpressionT")(klass, 1),
	base = FixedArityExpression,
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});

// DEPENDENCIES
var Value = require("../Value"),
	DayOfYearExpression = require("./DayOfYearExpression"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$week";
};

/**
 * Takes a date and returns the week of the year as a number between 0 and 53.
 * Weeks begin on Sundays, and week 1 begins with the first Sunday of the year.
 * Days preceding the first Sunday of the year are in week 0.
 * This behavior is the same as the “%U” operator to the strftime standard library function.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var date = this.operands[0].evaluateInternal(vars),
		dayOfWeek = date.getUTCDay(),
		dayOfYear = DayOfYearExpression.getDateDayOfYear(date),
		prevSundayDayOfYear = dayOfYear - dayOfWeek, // may be negative
		nextSundayDayOfYear = prevSundayDayOfYear + 7; // must be positive
	// Return the zero based index of the week of the next sunday, equal to the one based index of the week of the previous sunday, which is to be returned.
	return (nextSundayDayOfYear / 7) | 0; // also, the `| 0` here truncates this so that we return an integer
};

/** Register Expression */
Expression.registerExpression("$week", base.parse);
