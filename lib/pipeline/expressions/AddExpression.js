"use strict";

/**
 * Create an expression that finds the sum of n operands.
 * @class AddExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var AddExpression = module.exports = function AddExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
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

proto.isAssociativeAndCommutative = function isAssociativeAndCommutative() { return true; };


/**
 * Takes an array of one or more numbers and adds them together, returning the sum.
 * @method @evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var total = 0;
	for (var i = 0, n = this.operands.length; i < n; ++i) {
		var value = this.operands[i].evaluateInternal(vars);
		if (typeof value == "number") {
			total += Value.coerceToDouble(value);
		} else if (value instanceof Date) {
			//NOTE: DEVIATION FROM MONGO: We didn't implement this in the 2.4 Javascript.
			throw new Error("$add does not support dates; code 16415");
		} else if (value == null || value === undefined) {
			return null;
		} else {
			throw new Error("$add only supports numeric or date types, not "+typeof value+"; code 16554");
		}
	}
	if (typeof total != "number") throw new Error("$add resulted in a non-numeric type; code 16417");

	//NOTE: DEVIATION FROM MONGO: There is another set of if/else statements for converting longs, ints, and doubles.
	// I don't think this applies to us as we don't have multiples numeric datatypes.
	// see line 418 of expression.cpp

	return total;
};


/** Register Expression */
Expression.registerExpression(klass.opName,base.parse);
