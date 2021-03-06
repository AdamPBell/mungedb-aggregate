"use strict";

/**
 * $cond expression;  @see evaluate 
 * @class AndExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var CondExpression = module.exports = function CondExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = CondExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$cond";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(3);
	base.prototype.addOperand.call(this, expr);
};

/** 
 * Use the $cond operator with the following syntax:  { $cond: [ <boolean-expression>, <true-case>, <false-case> ] } 
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(3);
	var pCond = this.operands[0].evaluate(doc),
		idx = Value.coerceToBool(pCond) ? 1 : 2;
	return this.operands[idx].evaluate(doc);
};
