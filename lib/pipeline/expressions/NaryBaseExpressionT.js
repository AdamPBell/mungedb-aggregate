"use strict";

/**
 * Inherit from ExpressionVariadic or ExpressionFixedArity instead of directly from this class.
 * @class NaryBaseExpressionT
 * @extends mungedb-aggregate.pipeline.expressions.NaryExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
module.exports = function NaryBaseExpressionT(SubClass) {
	if (arguments.length !== 1) throw new Error(klass.name + "<" + SubClass.name + ">: expected args: SubClass");

	var NaryBaseExpression = function NaryBaseExpression() {
		if (arguments.length !== 0) throw new Error(klass.name + "<" + SubClass.name + ">: zero args expected");
		base.call(this);
	}, klass = NaryBaseExpression, NaryExpression = require("./NaryExpression"), base = NaryExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

	//NOTE: attach statics to emulate the C++ behavior
	for (var propName in base) //jshint ignore:line
		klass[propName] = base[propName];

	klass.parse = function parse(objExpr, vps) {
		var expr = new SubClass(),
			args = NaryExpression.parseArguments(objExpr, vps);
		expr.validateArguments(args);
		expr.operands = args;
		return expr;
	};

	return NaryBaseExpression;
};
