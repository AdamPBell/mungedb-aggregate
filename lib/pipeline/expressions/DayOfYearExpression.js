"use strict";

/**
 * Get the DayOfYear from a date.
 * @class DayOfYearExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var DayOfYearExpression = module.exports = function DayOfYearExpression(){
	this.nargs = 1;
	base.call(this);
}, klass = DayOfYearExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
    return "$dayOfYear";
};

/**
 * Takes a date and returns the day of the year as a number between 1 and 366.
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars){
	//NOTE: the below silliness is to deal with the leap year scenario when we should be returning 366
    var date = this.operands[0].evaluateInternal(vars);
    return klass.getDateDayOfYear(date);
};

// STATIC METHODS
klass.getDateDayOfYear = function getDateDayOfYear(d){
    var y11 = new Date(d.getUTCFullYear(), 0, 1),       // same year, first month, first day; time omitted
	ymd = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()+1);  // same y,m,d; time omitted, add 1 because days start at 1
    return Math.ceil((ymd - y11) / 86400000);   //NOTE: 86400000 ms is 1 day
};

/** Register Expression */
Expression.registerExpression("$dayOfYear",base.parse(DayOfYearExpression));
