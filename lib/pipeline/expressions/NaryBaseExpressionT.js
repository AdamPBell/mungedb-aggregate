"use strict";

/**
 * Inherit from ExpressionVariadic or ExpressionFixedArity instead of directly from this class.
 * @class NaryBaseExpressionT
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @extends mungedb-aggregate.pipeline.expressions.NaryExpression
 * @constructor
 */
var NaryBaseExpressionT = module.exports = function NaryBaseExpressionT(SubClass) {

	var NaryBaseExpression = function NaryBaseExpression() {
		if (arguments.length !== 0) throw new Error(klass.name + "<" + SubClass.name + ">: zero args expected");
		base.call(this);
	}, klass = NaryBaseExpression, NaryExpression = require("./NaryExpression"), base = NaryExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

	klass.parse = function(objExpr, vps) {
		var expr = new SubClass(),
			args = NaryExpression.parseArguments(objExpr, vps);
		expr.validateArguments(args);
		expr.operands = args;
		return expr;
	};

	return NaryBaseExpression;
};
