"use strict";

/**
 * The base class for all n-ary `Expression`s
 * @class NaryExpression
 * @extends mungedb-aggregate.pipeline.expressions.Expression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var NaryExpression = module.exports = function NaryExpression() {
	if (arguments.length !== 0) throw new Error("Zero args expected");
	this.operands = [];
	base.call(this);
}, klass = NaryExpression, Expression = require("./Expression"), base = Expression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Variables = require("./Variables"),
	ConstantExpression = require("./ConstantExpression");

proto.optimize = function optimize() {
	var n = this.operands.length;

	// optimize sub-expressions and count constants
	var constCount = 0;
	for (var i = 0; i < n; ++i) {
		var optimized = this.operands[i].optimize();

		// substitute the optimized expression
		this.operands[i] = optimized;

		// check to see if the result was a constant
		if (optimized instanceof ConstantExpression) {
			constCount++;
		}
	}

	// If all the operands are constant, we can replace this expression with a constant. Using
	// an empty Variables since it will never be accessed.
	if (constCount === n) {
		var emptyVars = new Variables(),
			result = this.evaluateInternal(emptyVars),
			replacement = ConstantExpression.create(result);
		return replacement;
	}

	// Remaining optimizations are only for associative and commutative expressions.
	if(!this.isAssociativeAndCommutative()) {
		return this;
	}

	// Process vpOperand to split it into constant and nonconstant vectors.
	// This can leave vpOperand in an invalid state that is cleaned up after the loop.
	var constExprs = [],
		nonConstExprs = [];
	for (i = 0; i < this.operands.length; ++i) { // NOTE: vpOperand grows in loop
		var expr = this.operands[i];
		if (expr instanceof ConstantExpression) {
			constExprs.push(expr);
		} else {
			// If the child operand is the same type as this, then we can
			// extract its operands and inline them here because we know
			// this is commutative and associative.  We detect sameness of
			// the child operator by checking for equality of the opNames
			var nary = expr instanceof NaryExpression ? expr : undefined;
			if (!nary || nary.getOpName() !== this.getOpName) {
				nonConstExprs.push(expr);
			} else {
				// same expression, so flatten by adding to vpOperand which
				// will be processed later in this loop.
				Array.prototype.push.apply(this.operands, nary.operands);
			}
		}
	}

	// collapse all constant expressions (if any)
	var constValue;
	if (constExprs.length > 0) {
		this.operands = constExprs;
		var emptyVars2 = new Variables();
		constValue = this.evaluateInternal(emptyVars2);
	}

	// now set the final expression list with constant (if any) at the end
	this.operands = nonConstExprs;
	if (constExprs.length > 0) {
		this.operands.push(ConstantExpression.create(constValue));
	}

	return this;
};

proto.addDependencies = function addDependencies(deps, path) {
	for (var i = 0, l = this.operands.length; i < l; ++i) {
		this.operands[i].addDependencies(deps);
	}
};

/**
 * Add an operand to the n-ary expression.
 * @method addOperand
 * @param expr the expression to add
 */
proto.addOperand = function addOperand(expr) {
	this.operands.push(expr);
};

proto.serialize = function serialize(explain) {
	var nOperand = this.operands.length,
		array = [];
	// build up the array
	for (var i = 0; i < nOperand; i++) {
		array.push(this.operands[i].serialize(explain));
	}

	var obj = {};
	obj[this.getOpName()] = array;
	return obj;
};

proto.isAssociativeAndCommutative = function isAssociativeAndCommutative() {
	return false;
};

/**
 * Get the name of the operator.
 * @method getOpName
 * @returns the name of the operator; this string belongs to the class
 *  implementation, and should not be deleted
 *  and should not
 */
proto.getOpName = function getOpName() {
	throw new Error("NOT IMPLEMENTED BY INHERITOR");
};

/**
 * Allow subclasses the opportunity to validate arguments at parse time.
 * @method validateArguments
 * @param {[type]} args [description]
 */
proto.validateArguments = function(args) {};

klass.parseArguments = function(exprElement, vps) {
	var out = [];
	if (exprElement instanceof Array) {
		for (var ii = 0; ii < exprElement.length; ii++) {
			out.push(Expression.parseOperand(exprElement[ii], vps));
		}
	} else {
		out.push(Expression.parseOperand(exprElement, vps));
	}
	return out;
};
