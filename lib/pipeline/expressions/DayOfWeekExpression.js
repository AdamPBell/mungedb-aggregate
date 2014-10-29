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
}, klass = DayOfWeekExpression, base = require("./FixedArityExpressionT")(klass, 1), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Expression = require("./Expression");

// STATIC MEMBERS
klass.extract = function extract(date) {
	return date.getUTCDay()+1;
};

klass.opName = "$dayOfWeek";

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return klass.opName;
};

/**
 * Takes a date and returns the day of the week as a number between 1 (Sunday) and 7 (Saturday.)
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars){
	var date = this.operands[0].evaluateInternal(vars);
	return klass.extract(date);
};

/** Register Expression */
Expression.registerExpression(klass.opName, base.parse(klass));