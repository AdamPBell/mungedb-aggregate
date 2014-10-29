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
	base.call(this);
}, klass = MillisecondExpression, base = require("./FixedArityExpressionT")(klass, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});

// DEPENDENCIES
var Expression = require("./Expression");

// STATIC MEMBERS
klass.extract = function extract(date) {
	return date.getUTCMilliseconds();	//TODO: incorrect for last millisecond of leap year, need to fix...
	// currently leap milliseconds are unsupported in v8
	// http://code.google.com/p/v8/issues/detail?id=1944
};

klass.opName = "$millisecond";

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return klass.opName;
};

/**
 * Takes a date and returns the millisecond between 0 and 999, but can be 1000 to account for leap milliseconds.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var date = this.operands[0].evaluateInternal(vars);
	return klass.extract(date); 
};

/** Register Expression */
Expression.registerExpression(klass.opName, base.parse);