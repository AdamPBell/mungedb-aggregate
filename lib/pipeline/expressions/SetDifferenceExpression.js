"use strict";

/**
 * A $setdifference pipeline expression.
 * @see evaluateInternal
 * @class SetDifferenceExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SetDifferenceExpression = module.exports = function SetDifferenceExpression() {
	this.nargs = 2;
	base.call(this);
}, klass = SetDifferenceExpression,
	base = require("./NaryExpression"),
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$setdifference";
};

/**
 * Takes 2 arrays. Assigns the second array to the first array.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var array1 = this.operands[0].evaluateInternal(vars),
		array2 = this.operands[1].evaluateInternal(vars);
	if (array1 instanceof Array) throw new Error(this.getOpName() + ": object 1 must be an array");
	if (array2 instanceof Array) throw new Error(this.getOpName() + ": object 2 must be an array");

	var returnVec = [];

	array1.forEach(function(key) {
		if (-1 === array2.indexOf(key)) {
			returnVec.push(key);
		}
	}, this);
	return returnVec;
};

/** Register Expression */
Expression.registerExpression("$setdifference", base.parse(SetDifferenceExpression));
