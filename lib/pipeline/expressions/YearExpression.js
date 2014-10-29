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
}, klass = YearExpression, base = require("./FixedArityExpressionT")(klass, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression");

// STATIC METHODS
klass.extract = function extract(date) {
	return date.getUTCFullYear();
};

klass.opName = "$year";

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return klass.opName;
};

/**
 * Takes a date and returns the full year.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var date = this.operands[0].evaluateInternal(vars);
	return klass.extract(date);
};

/** Register Expression */
Expression.registerExpression(klass.opName, base.parse);