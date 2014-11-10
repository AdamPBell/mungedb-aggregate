"use strict";

/**
 * Create an expression that returns true exists in all elements.
 * @class AllElementsTrueExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var AllElementsTrueExpression = module.exports = function AllElementsTrueExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = AllElementsTrueExpression, base = require("./FixedArityExpressionT")(AllElementsTrueExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var arr = this.operands[0].evaluateInternal(vars);
	if (!(arr instanceof Array))
		throw new Error(this.getOpName() + "'s argument must be an array, but is " +
			Value.getType(arr) + "; uassert code 17040");
	for (var i = 0, l = arr.length; i < l; ++i) {
		if (!Value.coerceToBool(arr[i])) {
			return false;
		}
	}
	return true;
};

Expression.registerExpression("$allElementsTrue", base.parse);

proto.getOpName = function getOpName() {
	return "$allElementsTrue";
};
