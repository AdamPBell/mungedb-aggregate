"use strict";

/**
 * The base class for all n-ary `Expression`s
 * @class NaryExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @extends mungedb-aggregate.pipeline.expressions.Expression
 * @constructor
 **/
var Expression = require("./Expression");

var NaryExpression = module.exports = function NaryExpression(){
	if (arguments.length !== 0) throw new Error("Zero args expected");
	this.operands = [];
	base.call(this);
}, klass = NaryExpression, base = Expression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.parse = function(SubClass) {
	return function parse(expr, vps) {
		var outExpr = new SubClass(),
			args = NaryExpression.parseArguments(expr, vps);
		outExpr.validateArguments(args);
		outExpr.operands = args;
		return outExpr;
	};
};

klass.parseArguments = function(exprElement, vps) {
	var out = [];
	if(exprElement instanceof Array) {
		for(var ii = 0; ii < exprElement.length; ii++) {
			out.push(Expression.parseOperand(exprElement[ii], vps));
		}
	} else {
		out.push(Expression.parseOperand(exprElement, vps));
	}
	return out;
};


function partitionBy(fn, coll) {
	var ret = {pass:[],
			   fail:[]};
	coll.forEach(function(x) {
		if(fn(x)) {
			ret.pass.push(x);
		} else {
			ret.fail.push(x);
		}
	});
	return ret;
}
// DEPENDENCIES
var ConstantExpression = require("./ConstantExpression");

// PROTOTYPE MEMBERS
proto.evaluate = undefined; // evaluate(doc){ ... defined by inheritor ... }

proto.getOpName = function getOpName(doc){
	throw new Error("NOT IMPLEMENTED BY INHERITOR");
};

proto.optimize = function optimize(){
	var n = this.operands.length,
		constantCount = 0;

	for(var ii = 0; ii < n; ii++) {
		if(this.operands[ii] instanceof ConstantExpression) {
			constantCount++;
		} else {
			this.operands[ii] = this.operands[ii].optimize();
						}
					}

	if(constantCount === n) {
		return new ConstantExpression(this.evaluateInternal({}));
				}

	if(!this.isAssociativeAndCommutative) {
		return this;
	}

	// Flatten and inline nested operations of the same type

	var similar = partitionBy(function(x){ return x.getOpName() === this.getOpName();}, this.operands);

	this.operands = similar.fail;
	similar.pass.forEach(function(x){
		this.operands.concat(x.operands);
	});

	// Partial constant folding

	var constantOperands = partitionBy(function(x) {return x instanceof ConstantExpression;}, this.operands);

	this.operands = constantOperands.pass;
	this.operands = [new ConstantExpression(this.evaluateInternal({}))].concat(constantOperands.fail);

	return this;
};

proto.addDependencies = function addDependencies(deps){
	for(var i = 0, l = this.operands.length; i < l; ++i)
		this.operands[i].addDependencies(deps);
};

/**
 * Add an operand to the n-ary expression.
 * @method addOperand
 * @param pExpression the expression to add
 **/
proto.addOperand = function addOperand(expr) {
	this.operands.push(expr);
};

proto.serialize = function serialize() {
	var ret = {}, subret = [];
	for(var ii = 0; ii < this.operands.length; ii++) {
		subret.push(this.operands[ii].serialize());
	}
	ret[this.getOpName()] = subret;
	return ret;
};

proto.fixedArity = function(nargs) {
	this.nargs = nargs;
};

proto.validateArguments = function(args) {
	if(this.nargs !== args.length) {
		throw new Error("Expression " + this.getOpName() + " takes exactly " + this.nargs + " arguments. " + args.length + " were passed in.");
	}
};
