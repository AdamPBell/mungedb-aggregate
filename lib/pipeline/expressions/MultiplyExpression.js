"use strict";

/** 
 * A $multiply pipeline expression. 
 * @see evaluateInternal 
 * @class MultiplyExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var MultiplyExpression = module.exports = function MultiplyExpression(){
	if (arguments.length !== 1) throw new Error("one arg expected");
	base.call(this);
}, klass = MultiplyExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
 Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$multiply";
};

/** 
 * Takes an array of one or more numbers and multiples them, returning the resulting product. 
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars){
	var product = 1;
	for(var i = 0, n = this.operands.length; i < n; ++i){
		var value = this.operands[i].evaluateInternal(vars);
		if(value instanceof Date) throw new Error("$multiply does not support dates; code 16375");
		product *= Value.coerceToDouble(value);
	}
	if(typeof(product) != "number") throw new Error("$multiply resulted in a non-numeric type; code 16418");
	return product;
};

/** Register Expression */
Expression.registerExpression("$multiply", klass.parse(MultiplyExpression));