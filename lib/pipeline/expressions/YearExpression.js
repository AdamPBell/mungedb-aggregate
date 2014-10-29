"use strict";

/**
 * A $year pipeline expression.
 * @see evaluateInternal
 * @class YearExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var YearExpression = module.exports = function YearExpression() {
	base.call(this);
}, klass = YearExpression,
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
	return "$year";
};

/**
 * Takes a date and returns the full year.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var date = this.operands[0].evaluateInternal(vars);
	return date.getUTCFullYear();
};

/** Register Expression */
Expression.registerExpression("$year", base.parse);
