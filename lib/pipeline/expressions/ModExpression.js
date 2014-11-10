"use strict";

/**
 * An $mod pipeline expression.
 * @see evaluate
 * @class ModExpression
 * @extends mungedb-aggregate.pipeline.expressions.FixedArityExpressionT
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var ModExpression = module.exports = function ModExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = ModExpression, base = require("./FixedArityExpressionT")(ModExpression, 2), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var lhs = this.operands[0].evaluateInternal(vars),
		rhs = this.operands[1].evaluateInternal(vars);

	if (typeof lhs === "number" && typeof rhs === "number") {
		// ensure we aren't modding by 0
		if (rhs === 0)
			throw new Error("can't $mod by 0; uassert code 16610");

		return lhs % rhs;
	} else if (lhs === undefined || lhs === null || rhs === undefined || rhs === null) {
		return null;
	} else {
		throw new Error("$mod only supports numeric types, not " +
			Value.getType(lhs) +
			" and " +
			Value.getType(rhs) + "; uasserted code 16611");
	}
};

Expression.registerExpression("$mod", base.parse);

proto.getOpName = function getOpName() {
	return "$mod";
};
