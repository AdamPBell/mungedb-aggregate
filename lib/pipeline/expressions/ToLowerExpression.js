"use strict";

/**
 * A $toLower pipeline expression.
 * @class ToLowerExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var ToLowerExpression = module.exports = function ToLowerExpression(){
	if (arguments.length !== 0) throw new Error(klass.name + ": args expected: value");
	base.call(this);
}, klass = ToLowerExpression, base = require("./FixedArityExpressionT")(ToLowerExpression, 1), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}}); //jshint ignore:line

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var pString = this.operands[0].evaluateInternal(vars),
		str = Value.coerceToString(pString);
	return str.toLowerCase();
};

Expression.registerExpression("$toLower", base.parse);

proto.getOpName = function getOpName(){
	return "$toLower";
};
