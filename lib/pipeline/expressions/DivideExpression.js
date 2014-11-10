"use strict";

/**
 * A $divide pipeline expression.
 * @see evaluateInternal
 * @class DivideExpression
 * @extends mungedb-aggregate.pipeline.expressions.FixedArityExpressionT
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var DivideExpression = module.exports = function DivideExpression(){
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = DivideExpression, base = require("./FixedArityExpressionT")(DivideExpression, 2), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

var Value = require("../Value"),
	Expression = require("./Expression");

/**
 * Takes an array that contains a pair of numbers and returns the value of the first number divided by the second number.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var lhs = this.operands[0].evaluateInternal(vars),
		rhs = this.operands[1].evaluateInternal(vars);

	if (typeof lhs === "number" && typeof rhs === "number") {
		var numer = lhs,
			denom = rhs;
		if (denom === 0) throw new Error("can't $divide by zero; uassert code 16608");

		return numer / denom;
	} else if (lhs === undefined || lhs === null || rhs === undefined || rhs === null) {
		return null;
	} else {
		throw new Error("$divide only supports numeric types, not " +
			Value.getType(lhs) +
			" and " +
			Value.getType(rhs) + "; uassert code 16609");
	}
};

Expression.registerExpression("$divide", base.parse);

proto.getOpName = function getOpName() {
	return "$divide";
};
