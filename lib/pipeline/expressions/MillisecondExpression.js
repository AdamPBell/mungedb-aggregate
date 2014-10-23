"use strict";

/**
 * An $millisecond pipeline expression.
 * @see evaluateInternal
 * @class MillisecondExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var MillisecondExpression = module.exports = function MillisecondExpression() {
    this.nargs = 1;
    base.call(this);
}, klass = MillisecondExpression,
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
    return "$millisecond";
};

/**
 * Takes a date and returns the millisecond between 0 and 999, but can be 1000 to account for leap milliseconds.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
    var date = this.operands[0].evaluateInternal(vars);
    return date.getUTCMilliseconds(); //TODO: incorrect for last millisecond of leap year, need to fix...
    // currently leap milliseconds are unsupported in v8
    // http://code.google.com/p/v8/issues/detail?id=1944
};

/** Register Expression */
Expression.registerExpression("$millisecond", base.parse(MillisecondExpression));