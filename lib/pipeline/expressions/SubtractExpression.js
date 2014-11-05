"use strict";

/**
 * A $subtract pipeline expression.
 * @see evaluateInternal
 * @class SubtractExpression
 * @extends mungedb-aggregate.pipeline.expressions.FixedArityExpressionT
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var SubtractExpression = module.exports = function SubtractExpression() {
	base.call(this);
}, klass = SubtractExpression, base = require("./FixedArityExpressionT")(SubtractExpression, 2), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var lhs = this.operands[0].evaluateInternal(vars),
		rhs = this.operands[1].evaluateInternal(vars);

	if (typeof lhs === "number" && typeof rhs === "number") {
		return lhs - rhs;
	} else if (lhs === null || lhs === undefined || rhs === null || rhs === undefined) {
		return null;
	} else if (lhs instanceof Date) {
		if (rhs instanceof Date) {
			var timeDelta = lhs - rhs;
			return timeDelta;
		} else if (typeof rhs === "number") {
			var millisSinceEpoch = lhs - Value.coerceToLong(rhs);
			return millisSinceEpoch;
		} else {
			throw new Error("can't $subtract a " +
				Value.getType(rhs) +
				" from a Date" +
				"; uassert code 16613");
		}
	} else {
		throw new Error("can't $subtract a " +
			Value.getType(rhs) +
			" from a " +
			Value.getType(lhs) +
			"; uassert code 16556");
	}
};

Expression.registerExpression("$subtract", base.parse);

proto.getOpName = function getOpName() {
	return "$subtract";
};
