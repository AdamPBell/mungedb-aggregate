"use strict";

/** 
 * Create an expression that returns true exists in all elements.
 * @class AllElementsTrueExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var AllElementsTrueExpression = module.exports = function AllElementsTrueExpression() {
		this.fixedArity(1);
		if (arguments.length !== 0) throw new Error("zero args expected");
		base.call(this);
}, klass = AllElementsTrueExpression,
		NaryExpression = require("./NaryExpression"),
		base = NaryExpression,
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
		var value = evaluateInternal(vars);
		if (!vars instanceof Array) throw new Error("$allElementsTrue requires an array");

		for (var i = 0, n = this.operands.length; i < n; ++i) {
				var checkValue = this.operands[i].evaluateInternal(vars);
				if (!checkValue.coerceToBool()) return false;
		}
		return true;

};

/** Register Expression */
Expression.registerExpression("$allElementsTrue", AllElementsTrueExpression.parse);