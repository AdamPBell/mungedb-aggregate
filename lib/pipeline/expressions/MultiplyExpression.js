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
	if (arguments.length !== 0) throw new Error("Zero args expected");
	base.call(this);
}, klass = MultiplyExpression, base = require("./VariadicExpressionT")(MultiplyExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
 Expression = require("./Expression");

// PROTOTYPE MEMBERS
klass.opName = "$multiply";
proto.getOpName = function getOpName(){
	return klass.opName;
};

proto.isAssociativeAndCommutative = function isAssociativeAndCommutative() { return true; };

/**
 * Takes an array of one or more numbers and multiples them, returning the resulting product.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars){
	var product = 1;
	for(var i = 0, n = this.operands.length; i < n; ++i){
		var value = this.operands[i].evaluateInternal(vars);
		if (typeof value == "number") {
			product *= Value.coerceToDouble(value);
		} else if (value == null || value == undefined) {
			return null;
		} else {
			throw new Error("$multiply only supports numeric types, not "+typeof value+"; code 16555");
		}
	}
	//NOTE: DEVIATION FROM MONGO: The c++ code (expressions.cpp line 1659) deals with types that
	// do not seem to apply to javascript.
	if(typeof(product) != "number") throw new Error("$multiply resulted in a non-numeric type; code 16418");
	return product;
};

/** Register Expression */
Expression.registerExpression(klass.opName, base.parse);
