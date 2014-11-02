"use strict";

/**
 * Create an expression that returns true exists in all elements.
 * @class AllElementsTrueExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var AllElementsTrueExpression = module.exports = function AllElementsTrueExpression() {
	base.call(this);
},
	klass = AllElementsTrueExpression,
	FixedArityExpression = require("./FixedArityExpressionT")(klass, 1),
	base = FixedArityExpression,
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});

// DEPENDENCIES
var Value = require("../Value"),
	CoerceToBoolExpression = require("./CoerceToBoolExpression"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$allElementsTrue";
};

/**
 * Takes an array of one or more numbers and returns true if all.
 * @method @evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var arr = this.operands[0].evaluateInternal(vars);

	if (!(arr instanceof Array)) throw new Error("uassert 17040: argument of " + this.getOpName() + "  must be an array, but is " + typeof arr);

	//Deviation from mongo. This is needed so that empty array is handled properly.
	if (arr.length === 0){
		return false;
	}

	for (var i = 0, n = arr.length; i < n; ++i) {
		if (! Value.coerceToBool(arr[i])){
			return false;
		}
	}
	return true;
};

/** Register Expression */
Expression.registerExpression("$allElementsTrue", base.parse);
