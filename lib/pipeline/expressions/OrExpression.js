"use strict";

/**
 * An $or pipeline expression.
 * @class OrExpression
 * @extends mungedb-aggregate.pipeline.expressions.VariadicExpressionT
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var OrExpression = module.exports = function OrExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = OrExpression, base = require("./VariadicExpressionT")(OrExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

var Value = require("../Value"),
	ConstantExpression = require("./ConstantExpression"),
	CoerceToBoolExpression = require("./CoerceToBoolExpression"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars){
	var n = this.operands.length;
	for (var i = 0; i < n; ++i) {
		var value = this.operands[i].evaluateInternal(vars);
		if (Value.coerceToBool(value))
			return true;
	}
	return false;
};

proto.optimize = function optimize() {
	// optimize the disjunction as much as possible
	var expr = base.prototype.optimize.call(this);

	// if the result isn't a disjunction, we can't do anything
	var orExp = expr instanceof OrExpression ? expr : undefined;
	if (!orExp)
		return expr;

	/*
	 * Check the last argument on the result; if it's not constant (as
	 * promised by ExpressionNary::optimize(),) then there's nothing
	 * we can do.
	 */
	var n = orExp.operands.length;
	// ExpressionNary::optimize() generates an ExpressionConstant for {$or:[]}.
	if (n <= 0) throw new Error("Assertion failuer");
	var lastExpr = orExp.operands[n - 1],
		constExpr = lastExpr instanceof ConstantExpression ? lastExpr : undefined;
	if (!constExpr)
		return expr;

	/*
	 * Evaluate and coerce the last argument to a boolean.  If it's true,
	 * then we can replace this entire expression.
	 */
	var last = Value.coerceToBool(constExpr.evaluateInternal());
	if (last)
		return ConstantExpression.create(true);

	/*
	 * If we got here, the final operand was false, so we don't need it
	 * anymore.  If there was only one other operand, we don't need the
	 * conjunction either.  Note we still need to keep the promise that
	 * the result will be a boolean.
	 */
	if (n === 2)
		return CoerceToBoolExpression.create(orExp.operands[0]);

	/*
	 * Remove the final "false" value, and return the new expression.
	 */
	orExp.operands.length = n - 1;
	return expr;
};

Expression.registerExpression("$or", base.parse);

proto.getOpName = function getOpName() {
	return "$or";
};

proto.isAssociativeAndCommutative = function isAssociativeAndCommutative() {
	return true;
};
