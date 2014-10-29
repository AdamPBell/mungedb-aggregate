"use strict";

/**
 * A $setdifference pipeline expression.
 * @see evaluateInternal
 * @class SetDifferenceExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SetDifferenceExpression = module.exports = function SetDifferenceExpression() {
	base.call(this);
}, klass = SetDifferenceExpression,
	FixedArityExpression = require("./FixedArityExpressionT")(klass, 2),
	base = FixedArityExpression,
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression"),
	Helpers = require("./Helpers")

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$setdifference";
};

/**
 * Takes 2 arrays. Returns the difference
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var lhs = this.operands[0].evaluateInternal(vars),
		rhs = this.operands[1].evaluateInternal(vars);

	if (lhs instanceof Array) throw new Error(this.getOpName() + ": object 1 must be an array. Got a(n): " + typeof lhs);
	if (rhs instanceof Array) throw new Error(this.getOpName() + ": object 2 must be an array. Got a(n): " + typeof rhs);

	var rhsSet = Helpers.arrayToSet(rhs),
		returnVec = [];

	lhs.forEach(function(key) {
		if (-1 === rhsSet.indexOf(key)) {
			returnVec.push(key);
		}
	}, this);

	return Value.consume(returnVec);
};

/** Register Expression */
Expression.registerExpression("$setdifference", base.parse);
