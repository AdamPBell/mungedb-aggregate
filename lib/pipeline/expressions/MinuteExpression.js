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
	base.call(this);
}, klass = MinuteExpression, base = require("./FixedArityExpressionT")(klass, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});

// DEPENDENCIES
var Expression = require("./Expression");

//STATIC MEMBERS
klass.extract = function extract(date) {
	return date.getUTCMinutes();
};

klass.opName = "$minute";

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return klass.opName;
};

/**
 * Takes a date and returns the minute between 0 and 59.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var date = this.operands[0].evaluateInternal(vars);
	return klass.extract(date);
};

/** Register Expression */
Expression.registerExpression(klass.opName, base.parse);