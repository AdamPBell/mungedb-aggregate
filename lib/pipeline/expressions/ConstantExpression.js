"use strict";

var Value = require("../Value"),
    Expression = require("./Expression");

/**
 * Internal expression for constant values
 * @class ConstantExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var ConstantExpression = module.exports = function ConstantExpression(value){
    if (arguments.length !== 1) throw new Error(klass.name + ": args expected: value");
    this.value = value;
    base.call(this);
}, klass = ConstantExpression, base = require("./FixedArityExpressionT")(klass,1), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.parse = function parse(exprElement, vps) {
	return new ConstantExpression(exprElement);
};

klass.create = function create(value) {
	var constExpr = new ConstantExpression(value);
	return constExpr;
};

proto.optimize = function optimize() {
	// nothing to do
	return this;
};

proto.addDependencies = function addDependencies(deps, path) {
	// nothing to do
};

/**
 * Get the constant value represented by this Expression.
 * @method evaluate
 */
proto.evaluateInternal = function evaluateInternal(vars) {
	return this.value;
};

/// Helper function to easily wrap constants with $const.
function serializeConstant(val) {
    return {$const: val};
}

proto.serialize = function serialize(explain) {
	return serializeConstant(this.value);
};

Expression.registerExpression("$const", klass.parse);

Expression.registerExpression("$literal", klass.parse); // alias

proto.getOpName = function getOpName() {
	return "$const";
};
