"use strict";

/**
 * A $setunion pipeline expression.
 * @class SetUnionExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var SetUnionExpression = module.exports = function SetUnionExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = SetUnionExpression, base = require("./VariadicExpressionT")(SetUnionExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("../Value"),
	Expression = require("./Expression"),
	ValueSet = require("../ValueSet");

proto.evaluateInternal = function evaluateInternal(vars) {
	var unionedSet = new ValueSet(),
		n = this.operands.length;
	for (var i = 0; i < n; i++){
		var newEntries = this.operands[i].evaluateInternal(vars);
		if (newEntries === undefined || newEntries === null){
			return null;
		}
		if (!(newEntries instanceof Array))
			throw new Error("All operands of " + this.getOpName() + "must be arrays. One argument" +
				" is of type: " + Value.getType(newEntries) + "; uassert code 17043");

		unionedSet.insertRange(newEntries);
	}
	return unionedSet.values();
};

Expression.registerExpression("$setUnion", base.parse);

proto.getOpName = function getOpName() {
	return "$setUnion";
};

proto.isAssociativeAndCommutative = function isAssociativeAndCommutative() {
	return true;
};
