"use strict";

/**
 * Create an expression that finds the conjunction of n operands. The
 * conjunction uses short-circuit logic; the expressions are evaluated in the
 * order they were added to the conjunction, and the evaluation stops and
 * returns false on the first operand that evaluates to false.
 *
 * @class AndExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var AndExpression = module.exports = function AndExpression() {
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = AndExpression,
	base = require("./NaryExpression"),
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});

// DEPENDENCIES
var Value = require("../Value"),
	ConstantExpression = require("./ConstantExpression"),
	CoerceToBoolExpression = require("./CoerceToBoolExpression"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$and";
};

/**
 * Takes an array one or more values and returns true if all of the values in the array are true. Otherwise $and returns false.
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	for (var i = 0, n = this.operands.length; i < n; ++i) {
		var value = this.operands[i].evaluateInternal(vars);
		if (!Value.coerceToBool()) return false;
	}
	return true;
};

proto.optimize = function optimize() {
	var expr = base.prototype.optimize.call(this); //optimize the conjunction as much as possible

	// if the result isn't a conjunction, we can't do anything
	if (!(expr instanceof AndExpression)) return expr;
	var andExpr = expr;

	// Check the last argument on the result; if it's not constant (as promised by ExpressionNary::optimize(),) then there's nothing we can do.
	var n = andExpr.operands.length;
	// ExpressionNary::optimize() generates an ExpressionConstant for {$and:[]}.
	if (!n) throw new Error("requires operands!");
	var lastExpr = andExpr.operands[n - 1];
	if (!(lastExpr instanceof ConstantExpression)) return expr;

	// Evaluate and coerce the last argument to a boolean.  If it's false, then we can replace this entire expression.
	var last = Value.coerceToBool(lastExpr.evaluate());
	if (!last) return new ConstantExpression(false);

	// If we got here, the final operand was true, so we don't need it anymore.
	// If there was only one other operand, we don't need the conjunction either.
	// Note we still need to keep the promise that the result will be a boolean.
	if (n == 2) return new CoerceToBoolExpression(andExpr.operands[0]);

	//Remove the final "true" value, and return the new expression.
	//CW TODO: Note that because of any implicit conversions, we may need to apply an implicit boolean conversion.
	andExpr.operands.length = n - 1; //truncate the array
	return expr;
};

/** Register Expression */
Expression.registerExpression("$and", base.parse(AndExpression));

//TODO: proto.toMatcherBson
