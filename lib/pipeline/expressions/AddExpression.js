"use strict";

/**
 * Create an expression that finds the sum of n operands.
 * @class AddExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var AddExpression = module.exports = function AddExpression(){
//	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = AddExpression, base = require("./VariadicExpressionT")(AddExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
klass.opName = "$add";
proto.getOpName = function getOpName(){
	return klass.opName;
};

/**
 * Takes an array of one or more numbers and adds them together, returning the sum.
 * @method @evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var total = 0;
	for (var i = 0, n = this.operands.length; i < n; ++i) {
		var value = this.operands[i].evaluateInternal(vars);
		if (value instanceof Date) throw new Error("$add does not support dates; code 16415");
		if (typeof value == "string") throw new Error("$add does not support strings; code 16416");
		total += Value.coerceToDouble(value);
	}
	if (typeof total != "number") throw new Error("$add resulted in a non-numeric type; code 16417");
	return total;
};


/** Register Expression */
Expression.registerExpression(klass.opName,base.parse);
