"use strict";

/**
 * A $multiply pipeline expression.
 * @class MultiplyExpression
 * @extends mungedb-aggregate.pipeline.expressions.VariadicExpressionT
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var MultiplyExpression = module.exports = function MultiplyExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = MultiplyExpression, base = require("./VariadicExpressionT")(MultiplyExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var product = 1; //NOTE: DEVIATION FROM MONGO: no need to track narrowest so just use one var

	var n = this.operands.length;
	for (var i = 0; i < n; ++i) {
		var val = this.operands[i].evaluateInternal(vars);

		if (typeof val === "number") {
			product *= Value.coerceToDouble(val);
		} else if (val === undefined || val === null) {
			return null;
		} else {
			throw new Error("$multiply only supports numeric types, not " +
			 	Value.getType(val) + "; uasserted code 16555");
		}
	}

	if (typeof product === "number")
		return product;
	throw new Error("$multiply resulted in a non-numeric type; massert code 16418");
};

Expression.registerExpression("$multiply", base.parse);

proto.getOpName = function getOpName(){
	return "$multiply";
};

proto.isAssociativeAndCommutative = function isAssociativeAndCommutative() {
	return true;
};
