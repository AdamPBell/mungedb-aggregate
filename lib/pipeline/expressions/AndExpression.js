"use strict";

/**
 * Create an expression that finds the conjunction of n operands. The
 * conjunction uses short-circuit logic; the expressions are evaluated in the
 * order they were added to the conjunction, and the evaluation stops and
 * returns false on the first operand that evaluates to false.
 *
 * @class AndExpression
 * @extends mungedb-aggregate.pipeline.expressions.VariadicExpressionT
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var AndExpression = module.exports = function AndExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = AndExpression, base = require("./VariadicExpressionT")(AndExpression), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}}); //jshint ignore:line

var Value = require("../Value"),
	ConstantExpression = require("./ConstantExpression"),
	CoerceToBoolExpression = require("./CoerceToBoolExpression"),
	Expression = require("./Expression");

proto.optimize = function optimize() {
	// optimize the conjunction as much as possible
	var expr = base.prototype.optimize.call(this);

	// if the result isn't a conjunction, we can't do anything
	var andExpr = expr instanceof AndExpression ? expr : undefined;
	if (!andExpr)
		return expr;

	/*
	 * Check the last argument on the result; if it's not constant (as
	 * promised by ExpressionNary::optimize(),) then there's nothing
	 * we can do.
	 */
	var n = andExpr.operands.length;
	// ExpressionNary::optimize() generates an ExpressionConstant for {$and:[]}.
	if (n <= 0) throw new Error("Assertion failure");
	var lastExpr = andExpr.operands[n - 1],
		constExpr = lastExpr instanceof ConstantExpression ? lastExpr : undefined;
	if (!constExpr)
		return expr;

	/*
	 * Evaluate and coerce the last argument to a boolean.  If it's false,
	 * then we can replace this entire expression.
	 */
	var last = Value.coerceToBool(constExpr.getValue());
	if (!last)
		return ConstantExpression.create(false);

	/*
	 * If we got here, the final operand was true, so we don't need it
	 * anymore.  If there was only one other operand, we don't need the
	 * conjunction either.  Note we still need to keep the promise that
	 * the result will be a boolean.
	 */
	if (n === 2)
		return CoerceToBoolExpression.create(andExpr.operands[0]);

	/*
	 * Remove the final "true" value, and return the new expression.
	 *
	 * CW TODO:
	 * Note that because of any implicit conversions, we may need to
	 * apply an implicit boolean conversion.
	 */
	andExpr.operands.length = n - 1;
	return expr;
};

proto.evaluateInternal = function evaluateInternal(vars) {
	var n = this.operands.length;
	for (var i = 0; i < n; ++i) {
		var value = this.operands[i].evaluateInternal(vars);
		if (!Value.coerceToBool(value))
			return false;
	}
	return true;
};

Expression.registerExpression("$and", base.parse);

proto.getOpName = function getOpName() {
	return "$and";
};

proto.isAssociativeAndCommutative = function isAssociativeAndCommutative() {
	return true;
};
