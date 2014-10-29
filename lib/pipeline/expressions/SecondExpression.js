"use strict";

/**
 * An $second pipeline expression.
 * @see evaluateInternal
 * @class SecondExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SecondExpression = module.exports = function SecondExpression() {
	base.call(this);
}, klass = SecondExpression, base = require("./FixedArityExpressionT")(klass, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});

// DEPENDENCIES
var Expression = require("./Expression");

//STATIC MEMBERS
klass.extract = function extract(date) {
	return date.getUTCSeconds();	//TODO: incorrect for last second of leap year, need to fix...
	// currently leap seconds are unsupported in v8
	// http://code.google.com/p/v8/issues/detail?id=1944
};

klass.opName = "$second";

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return klass.opName;
};

/**
 * Takes a date and returns the second between 0 and 59, but can be 60 to account for leap seconds.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var date = this.operands[0].evaluateInternal(vars);
	return klass.extract(date);
};

/** Register Expression */
Expression.registerExpression(klass.opName, base.parse);