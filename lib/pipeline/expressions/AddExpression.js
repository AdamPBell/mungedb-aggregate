"use strict";

/**
 * Create an expression that finds the sum of n operands.
 * @class AddExpression
 * @extends mungedb-aggregate.pipeline.expressions.VariadicExpressionT
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var AddExpression = module.exports = function AddExpression(){
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = AddExpression, base = require("./VariadicExpressionT")(AddExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("../Value"),
	Expression = require("./Expression");

proto.evaluateInternal = function evaluateInternal(vars) {
	var total = 0, //NOTE: DEVIATION FROM MONGO: no need to track narrowest so just use one var
		haveDate = false;

	var n = this.operands.length;
	for (var i = 0; i < n; ++i) {
		var val = this.operands[i].evaluateInternal(vars);
		if (typeof val === "number") {
			total += val;
		} else if (val instanceof Date) {
			if (haveDate)
				throw new Error("only one Date allowed in an $add expression; uassert code 16612");
			haveDate = true;

			total += val.getTime();
		} else if (val === undefined || val === null) {
			return null;
		} else {
			throw new Error("$add only supports numeric or date types, not " +
				Value.getType(val) + "; uasserted code 16554");
		}
	}

	if (haveDate) {
		return new Date(total);
	} else if (typeof total === "number") {
		return total;
	} else {
		throw new Error("$add resulted in a non-numeric type; massert code 16417");
	}
};


Expression.registerExpression("$add", base.parse);

proto.getOpName = function getOpName(){
	return "$add";
};

proto.isAssociativeAndCommutative = function isAssociativeAndCommutative() {
	return true;
};
