"use strict";

/**
 * Get the DayOfMonth from a date.
 * @class DayOfMonthExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var DayOfMonthExpression = module.exports = function DayOfMonthExpression() {
    base.call(this);
}, klass = DayOfMonthExpression, base = require("./FixedArityExpressionT")(klass, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});

// DEPENDENCIES
var Expression = require("./Expression");

// STATIC MEMBERS
klass.extract = function extract(date) {
    return date.getUTCDate();
};

klass.opName = "$dayOfMonth";

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
    return klass.opName;
};

/**
 * Takes a date and returns the day of the month as a number between 1 and 31.
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
    var date = this.operands[0].evaluateInternal(vars);
    return klass.extract(date);
};

/** Register Expression */
Expression.registerExpression(klass.opName, base.parse);