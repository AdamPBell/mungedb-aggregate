"use strict";

/**
 * Create an expression that returns true exists in any element.
 * @class AnyElementTrueExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var AnyElementTrueExpression = module.exports = function AnyElementTrueExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = AnyElementTrueExpression, base = require("./FixedArityExpressionT")(AnyElementTrueExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var arr = this.operands[0].evaluateInternal(vars);
	if (!(arr instanceof Array)) throw new Error(this.getOpName() + "'s argument must be an array, but is " + Value.getType(arr) + "; uassert code 17041");
	for (var i = 0, l = arr.length; i < l; ++i) {
		if (Value.coerceToBool(arr[i])) {
			return true;
		}
	}
	return false;
};

Expression.registerExpression("$anyElementTrue",base.parse);

proto.getOpName = function getOpName() {
	return "$anyElementTrue";
};
