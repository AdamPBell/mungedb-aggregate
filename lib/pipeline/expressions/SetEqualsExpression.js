"use strict";

/**
 * A $setequals pipeline expression.
 * @class SetEqualsExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var SetEqualsExpression = module.exports = function SetEqualsExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = SetEqualsExpression, base = require("./VariadicExpressionT")(SetEqualsExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("../Value"),
	Expression = require("./Expression"),
	Helpers = require("./Helpers");

proto.validateArguments = function validateArguments(args) {
	if (args.length < 2)
		throw new Error(this.getOpName() + " needs at least two arguments had: " +
			args.length + "; uassert code 17045");
};

proto.evaluateInternal = function evaluateInternal(vars) {
	var n = this.operands.length,
		lhs;

	for (var i = 0; i < n; i++) {
		var nextEntry = this.operands[i].evaluateInternal(vars);
		if (!(nextEntry instanceof Array))
			throw new Error("All operands of " + this.getOpName() +" must be arrays. One " +
				"argument is of type: " + Value.getType(nextEntry) + "; uassert code 17044");

		if (i === 0) {
			lhs = Helpers.arrayToSet(nextEntry);
		} else {
			var rhs = Helpers.arrayToSet(nextEntry);
			if (Object.keys(lhs).join() !== Object.keys(rhs).join()) {
				return false;
			}
		}
	}
	return true;
};

Expression.registerExpression("$setEquals", base.parse);

proto.getOpName = function getOpName() {
	return "$setEquals";
};
