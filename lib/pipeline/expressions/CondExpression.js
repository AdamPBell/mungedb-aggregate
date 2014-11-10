"use strict";

/**
 * $cond expression;  @see evaluate
 * @class CondExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var CondExpression = module.exports = function CondExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": expected args: NONE");
	base.call(this);
}, klass = CondExpression, base = require("./FixedArityExpressionT")(CondExpression, 3), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var cond = this.operands[0].evaluateInternal(vars);
	var idx = Value.coerceToBool(cond) ? 1 : 2;
	return this.operands[idx].evaluateInternal(vars);
};

klass.parse = function parse(expr, vps) {
	if (Value.getType(expr) !== "Object") {
		return base.parse(expr, vps);
	}
	//verify(exprFieldName === "$cond"); //NOTE: DEVIATION FROM MONGO: no exprFieldName and probably not possible anyhow

	var ret = new CondExpression();
	ret.operands.length = 3;

	var args = expr;
	for (var argfieldName in args) { //jshint ignore:line
		if (!args.hasOwnProperty(argfieldName)) continue;
		if (argfieldName === "if") {
			ret.operands[0] = Expression.parseOperand(args.if, vps);
		} else if (argfieldName === "then") {
			ret.operands[1] = Expression.parseOperand(args.then, vps);
		} else if (argfieldName === "else") {
			ret.operands[2] = Expression.parseOperand(args.else, vps);
		} else {
			throw new Error("Unrecognized parameter to $cond: '" + argfieldName + "'; uasserted code 17083");
		}
	}

	if (!ret.operands[0]) throw new Error("Missing 'if' parameter to $cond; uassert code 17080");
	if (!ret.operands[1]) throw new Error("Missing 'then' parameter to $cond; uassert code 17081");
	if (!ret.operands[2]) throw new Error("Missing 'else' parameter to $cond; uassert code 17082");

	return ret;
};

Expression.registerExpression("$cond", CondExpression.parse);

proto.getOpName = function getOpName() {
	return "$cond";
};
