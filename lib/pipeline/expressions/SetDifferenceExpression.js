"use strict";

/**
 * A $setDifference pipeline expression.
 * @see evaluateInternal
 * @class SetDifferenceExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SetDifferenceExpression = module.exports = function SetDifferenceExpression() {

	if (arguments.length != 0) throw new Error("SetDifference constructor must be called with no args");

	base.call(this);
}, klass = SetDifferenceExpression,
	FixedArityExpression = require("./FixedArityExpressionT")(klass, 2),
	base = FixedArityExpression,
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
	return "$setDifference";
};

/**
 * Stolen from Value.
 * @param val
 * @returns {boolean}
 */
proto.nullish = function(val){
	return val == null || val == undefined;
}

//NOTE: DEVIATION FROM MONGO: This probably has already been written in a different branch.
proto.arrayToSet = function(a) {
	var tmp = {},
		b = [];
	a.forEach(function(item){
		tmp[item] = item;
	});
	Object.keys(tmp).forEach(function(item) {
		b.push(tmp[item]);
	});
	return b;
};

/**
 * Takes 2 arrays. Returns the items in the first array which are not in the second.
 * @method evaluateInternal
 **/

proto.evaluateInternal = function evaluateInternal(vars) {
	var array1 = this.operands[0].evaluateInternal(vars),
		array2 = this.operands[1].evaluateInternal(vars);

	if (this.nullish(array1) || this.nullish(array2)) return null;

	if (!(array1 instanceof Array)) throw new Error(this.getOpName() + ": object 1 must be an array; code 17048");
	if (!(array2 instanceof Array)) throw new Error(this.getOpName() + ": object 2 must be an array; code 17049");

	var returnVec = [],
		dedupped = this.arrayToSet(array1);
	dedupped.forEach(function(key) {
		if (-1 === array2.indexOf(key)) {
			returnVec.push(key);
		}
	}, this);
	return returnVec;
};

/** Register Expression */
Expression.registerExpression("$setDifference", base.parse);
