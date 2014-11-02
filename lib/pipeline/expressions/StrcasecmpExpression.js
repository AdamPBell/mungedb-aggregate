"use strict";

/**
 * A $strcasecmp pipeline expression.
 * @see evaluate
 * @class StrcasecmpExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var StrcasecmpExpression = module.exports = function StrcasecmpExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = StrcasecmpExpression, base = require("./FixedArityExpressionT")(StrcasecmpExpression, 2), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var string1 = this.operands[0].evaluateInternal(vars),
		string2 = this.operands[1].evaluateInternal(vars);

	var str1 = Value.coerceToString(string1).toUpperCase(),
		str2 = Value.coerceToString(string2).toUpperCase(),
		result = Value.compare(str1, str2);

	if (result === 0) {
		return 0;
	} else if (result > 0) {
		return 1;
	} else {
		return -1;
	}
};

Expression.registerExpression("$strcasecmp", base.parse);

proto.getOpName = function getOpName() {
	return "$strcasecmp";
};
