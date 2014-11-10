"use strict";

/**
 * A factory and base class for all expressions that are variadic (AKA they accept any number of arguments)
 * @class VariadicExpressionT
 * @extends mungedb-aggregate.pipeline.expressions.NaryBaseExpressionT
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
module.exports = function VariadicExpressionT(SubClass) {
	if (arguments.length !== 1) throw new Error(klass.name + "<" + SubClass.name + ">: expected args: SubClass");

	var VariadicExpression = function VariadicExpression() {
		if (arguments.length !== 0) throw new Error(klass.name + "<" + SubClass.name + ">: zero args expected");
		base.call(this);
	}, klass = VariadicExpression, base = require("./NaryBaseExpressionT")(SubClass), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}}); //jshint ignore:line

	//NOTE: attach statics to emulate the C++ behavior
	for (var propName in base) //jshint ignore:line
		klass[propName] = base[propName];

	return VariadicExpression;
};
