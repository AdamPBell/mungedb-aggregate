"use strict";

/**
 * A $substr pipeline expression.
 * @see evaluate 
 * @class SubstrExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SubstrExpression = module.exports = function SubstrExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = SubstrExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$substr";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(3);
	base.prototype.addOperand.call(this, expr);
};

/**
 * Takes a string and two numbers. The first number represents the number of bytes in the string to skip, and the second number specifies the number of bytes to return from the string.
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc) {
	this.checkArgCount(3);
	var val = this.operands[0].evaluate(doc),
		idx = this.operands[1].evaluate(doc),
		len = this.operands[2].evaluate(doc),
		str = Value.coerceToString(val);
	if (typeof(idx) != "number") throw new Error(this.getOpName() + ": starting index must be a numeric type; code 16034");
	if (typeof(len) != "number") throw new Error(this.getOpName() + ": length must be a numeric type; code 16035");
	if (idx >= str.length) return "";
	//TODO: Need to handle -1
	len = (len === -1 ? undefined : len);
	return str.substr(idx, len);
};
