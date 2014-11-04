"use strict";

/**
 * A $toUpper pipeline expression.
 * @class ToUpperExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var ToUpperExpression = module.exports = function ToUpperExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": args expected: value");
	base.call(this);
}, klass = ToUpperExpression, base = require("./FixedArityExpressionT")(ToUpperExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass }});

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var pString = this.operands[0].evaluateInternal(vars),
		str = Value.coerceToString(pString);
	return str.toUpperCase();
};

Expression.registerExpression("$toUpper", base.parse);

proto.getOpName = function getOpName() {
	return "$toUpper";
};
