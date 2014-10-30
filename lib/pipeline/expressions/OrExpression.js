"use strict";

/**
 * An $or pipeline expression.
 * @see evaluateInternal
 * @class OrExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var OrExpression = module.exports = function OrExpression(){
//	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = OrExpression, base = require("./VariadicExpressionT")(OrExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	ConstantExpression = require("./ConstantExpression"),
	CoerceToBoolExpression = require("./CoerceToBoolExpression"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
klass.opName = "$or";
proto.getOpName = function getOpName(){
	return klass.opName;
};

/**
 * Takes an array of one or more values and returns true if any of the values in the array are true. Otherwise $or returns false.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars){
	for(var i = 0, n = this.operands.length; i < n; ++i){
		var value = this.operands[i].evaluateInternal(vars);
		if (Value.coerceToBool(value)) return true;
	}
	return false;
};

proto.optimize = function optimize() {
	var pE = base.prototype.optimize.call(this); // optimize the disjunction as much as possible

	if (!(pE instanceof OrExpression)) return pE; // if the result isn't a disjunction, we can't do anything
	var pOr = pE;

	// Check the last argument on the result; if it's not const (as promised
	// by ExpressionNary::optimize(),) then there's nothing we can do.
	var n = pOr.operands.length;
	// ExpressionNary::optimize() generates an ExpressionConstant for {$or:[]}.
	if (!n) throw new Error("OrExpression must have operands!");
	var pLast = pOr.operands[n - 1];
	if (!(pLast instanceof ConstantExpression)) return pE;

	// Evaluate and coerce the last argument to a boolean.  If it's true, then we can replace this entire expression.
	var last = Value.coerceToBool();
	if (last) return new ConstantExpression(true);

	// If we got here, the final operand was false, so we don't need it anymore.
	// If there was only one other operand, we don't need the conjunction either.  Note we still need to keep the promise that the result will be a boolean.
	if (n == 2) return new CoerceToBoolExpression(pOr.operands[0]);

	// Remove the final "false" value, and return the new expression.
	pOr.operands.length = n - 1;
	return pE;
};

/** Register Expression */
Expression.registerExpression(klass.opName, base.parse);
