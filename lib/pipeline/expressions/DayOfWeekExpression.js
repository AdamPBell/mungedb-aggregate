"use strict";

/**
 * Get the DayOfWeek from a date.
 * @class DayOfWeekExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var DayOfWeekExpression = module.exports = function DayOfWeekExpression(){
	base.call(this);
}, klass = DayOfWeekExpression,
	FixedArityExpression = require("./FixedArityExpressionT")(klass, 1),
	base = FixedArityExpression,
	proto = klass.prototype = Object.create(base.prototype, {
		constructor:{
			value:klass
		}
	});

// DEPENDENCIES
var Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$dayOfWeek";
};

/**
 * Takes a date and returns the day of the week as a number between 1 (Sunday) and 7 (Saturday.)
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars){
	var date = this.operands[0].evaluateInternal(vars);
	return date.getUTCDay()+1;
};

/** Register Expression */
Expression.registerExpression("$dayOfWeek",base.parse);
