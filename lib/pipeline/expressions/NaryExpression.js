"use strict";

/**
 * The base class for all n-ary `Expression`s
 * @class NaryExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @extends mungedb-aggregate.pipeline.expressions.Expression
 * @constructor
 **/
var NaryExpression = module.exports = function NaryExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	this.operands = [];
	base.call(this);
}, klass = NaryExpression, base = require("./Expression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var ConstantExpression = require("./ConstantExpression");

// PROTOTYPE MEMBERS
proto.evaluate = undefined; // evaluate(doc){ ... defined by inheritor ... }

proto.getOpName = function getOpName(doc){
	throw new Error("NOT IMPLEMENTED BY INHERITOR");
};

proto.optimize = function optimize(){
	var constsFound = 0,
		stringsFound = 0;
	for (var i = 0, l = this.operands.length; i < l; i++) {
		var optimizedExpr = this.operands[i].optimize();
		if (optimizedExpr instanceof ConstantExpression) {
			constsFound++;
			if (typeof(optimizedExpr.value) == "string") stringsFound++;
		}
		this.operands[i] = optimizedExpr;
	}
	// If all the operands are constant, we can replace this expression with a constant.  We can find the value by evaluating this expression over a NULL Document because evaluating the ExpressionConstant never refers to the argument Document.
	if (constsFound === l) return new ConstantExpression(this.evaluate());
	// If there are any strings, we can't re-arrange anything, so stop now.     LATER:  we could concatenate adjacent strings as a special case.
	if (stringsFound) return this;
	// If there's no more than one constant, then we can't do any constant folding, so don't bother going any further.
	if (constsFound <= 1) return this;
	// If the operator isn't commutative or associative, there's nothing more we can do.  We test that by seeing if we can get a factory; if we can, we can use it to construct a temporary expression which we'll evaluate to collapse as many constants as we can down to a single one.
	var IExpression = this.getFactory();
	if (!(IExpression instanceof Function)) return this;
	// Create a new Expression that will be the replacement for this one.  We actually create two:  one to hold constant expressions, and one to hold non-constants.
	// Once we've got these, we evaluate the constant expression to produce a single value, as above.  We then add this operand to the end of the non-constant expression, and return that.
	var expr = new IExpression(),
		constExpr = new IExpression();
	for (i = 0; i < l; ++i) {
		var operandExpr = this.operands[i];
		if (operandExpr instanceof ConstantExpression) {
			constExpr.addOperand(operandExpr);
		} else {
			// If the child operand is the same type as this, then we can extract its operands and inline them here because we already know this is commutative and associative because it has a factory.  We can detect sameness of the child operator by checking for equality of the factory
			// Note we don't have to do this recursively, because we called optimize() on all the children first thing in this call to optimize().
			if (!(operandExpr instanceof NaryExpression)) {
				expr.addOperand(operandExpr);
			} else {
				if (operandExpr.getFactory() !== IExpression) {
					expr.addOperand(operandExpr);
				} else { // same factory, so flatten
					for (var i2 = 0, n2 = operandExpr.operands.length; i2 < n2; ++i2) {
						var childOperandExpr = operandExpr.operands[i2];
						if (childOperandExpr instanceof ConstantExpression) {
							constExpr.addOperand(childOperandExpr);
						} else {
							expr.addOperand(childOperandExpr);
						}
					}
				}
			}
		}
	}

	if (constExpr.operands.length === 1) { // If there was only one constant, add it to the end of the expression operand vector.
		expr.addOperand(constExpr.operands[0]);
	} else if (constExpr.operands.length > 1) { // If there was more than one constant, collapse all the constants together before adding the result to the end of the expression operand vector.
		var pResult = constExpr.evaluate();
		expr.addOperand(new ConstantExpression(pResult));
	}

	return expr;
};

proto.addDependencies = function addDependencies(deps){
	for(var i = 0, l = this.operands.length; i < l; ++i)
		this.operands[i].addDependencies(deps);
	return deps;
};

/**
 * Add an operand to the n-ary expression.
 * @method addOperand
 * @param pExpression the expression to add
 **/
proto.addOperand = function addOperand(expr) {
	this.operands.push(expr);
};

proto.getFactory = function getFactory() {
	return undefined;
};

proto.toJSON = function toJSON() {
	var o = {};
	o[this.getOpName()] = this.operands.map(function(operand){
		return operand.toJSON();
	});
	return o;
};

//TODO:	proto.toBson  ?   DONE NOW???
//TODO:	proto.addToBsonObj  ?
//TODO: proto.addToBsonArray  ?

/**
 * Checks the current size of vpOperand; if the size equal to or greater than maxArgs, fires a user assertion indicating that this operator cannot have this many arguments.
 * The equal is there because this is intended to be used in addOperand() to check for the limit *before* adding the requested argument.
 *
 * @method checkArgLimit
 * @param maxArgs the maximum number of arguments the operator accepts
 **/
proto.checkArgLimit = function checkArgLimit(maxArgs) {
	if (this.operands.length >= maxArgs) throw new Error(this.getOpName() + " only takes " + maxArgs + " operand" + (maxArgs == 1 ? "" : "s") + "; code 15993");
};

/**
 * Checks the current size of vpOperand; if the size is not equal to reqArgs, fires a user assertion indicating that this must have exactly reqArgs arguments.
 * This is meant to be used in evaluate(), *before* the evaluation takes place.
 *
 * @method checkArgCount
 * @param reqArgs the number of arguments this operator requires
 **/
proto.checkArgCount = function checkArgCount(reqArgs) {
	if (this.operands.length !== reqArgs) throw new Error(this.getOpName() + ":  insufficient operands; " + reqArgs + " required, only got " + this.operands.length + "; code 15997");
};

/**
 * Checks the current size of vpOperand; if the size does not fall within the min and max values (inclusive), fires a user assertion indicating that this must have exactly reqArgs arguments.
 * This is meant to be used in evaluate(), *before* the evaluation takes place.
 *
 * @method checkArgCountRange
 * @param min the minimum number of valid arguments
 * @param max the maximum number of valid arguments
 **/
proto.checkArgCountRange = function checkArgCountRange(min, max) {
	if (this.operands.length < min || this.operands.length > max) throw new Error(this.getOpName() + ":  insufficient operands; between " + min + " and " + max + " required, only got " + this.operands.length + "; code 15996");
};