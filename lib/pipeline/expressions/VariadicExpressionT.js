"use strict";

/**
 * A factory and base class for all expressions that are variadic (AKA they accept any number of arguments)
 * @class VariadicExpressionT
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/

var VariadicExpressionT = module.exports = function VariadicExpressionT(SubClass) {

	var VariadicExpression = function VariadicExpression() {
		if (arguments.length !== 0) throw new Error(klass.name + "<" + SubClass.name + ">: zero args expected");
		base.call(this);
	}, klass = VariadicExpression, base = require("./NaryBaseExpressionT")(SubClass), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});

	klass.parse = base.parse; 						// NOTE: Need to explicitly
	klass.parseArguments = base.parseArguments;		// bubble static members in
													// our inheritance chain
	return VariadicExpression;
};
