"use strict";

/**
 * A $setissubset pipeline expression.
 * @see evaluateInternal
 * @class SetIsSubsetExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SetIsSubsetExpression = module.exports = function SetIsSubsetExpression() {
	this.nargs = 2;
	if (arguments.length !== 2) throw new Error("two args expected");
	base.call(this);
}, klass = SetIsSubsetExpression,
	base = require("./NaryExpression"),
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});


var Optimized = function Optimized(cachedRhsSet, operands) {
	this.operands = operands;
}

Optimized.prototype = Object.create(SetIsSubsetExpression.prototype, {
	constructor: {
		value: Optimized
	}
});

Optimized.prototype.setIsSubsetHelper = function setIsSubsetHelper(vars){
		// do not shortcircuit when lhs.size() > rhs.size()
		// because lhs can have redundant entries
		lhs.forEach(function (item){
			if (! rhs.contains(item)){
				return false
			}
		});

		return true;
};

Optimized.prototype.evaluateInternal = function evaluateInternal(vars){
	lhs = operands[0].evaluateInternal(vars);
	rhs = operands[1].evaluateInternal(vars);

	if (!(lhs instanceof Array)) throw new Error("uassert 17046: both operands of " + this.getOpName() + "  must be arrays. Second argument is of type " + typeof lhs);
	if (!(rhs instanceof Array)) throw new Error("uassert 17042: both operands of " + this.getOpName() + "  must be arrays. Second argument is of type " + typeof rhs);

	return setIsSubsetHelper(lhs, arrayToSet(rhs));
};

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$setissubset";
};

//Returns an object containing unique values. All keys are the same as the corresponding value.
proto.arrayToSet = function arrayToSet(array){
	var set = {};

	// This ensures no duplicates.
	array.forEach(function (element) {
		var elementString = JSON.stringify(element);
		set[elementString] = element;
	});

	return set;
};

proto.optimize = function optimize(cachedRhsSet, operands) {

	// perform basic optimizations
	var optimized = this.optimize();

	// if NaryExoressuib.optimize() created a new value, return it directly
	if(optimized != this){
		return optimized;
	}

	if (operands[1] instanceof ConstantExpression){
		var ce = operands[1],
			rhs = ce.getValue();

		if (!(rhs instanceof Array)) throw new Error("uassert 17311: both operands of " + this.getOpName() + "  must be arrays. Second argument is of type " + typeof rhs);

		return new Optimized(proto.arrayToSet(rhs), operands);
	}

	return optimized;

};

/**
 * Takes 2 arrays. Returns true if the second is a subset of the first. Returns false otherwise.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var array1 = this.operands[0].evaluateInternal(vars),
		array2 = this.operands[1].evaluateInternal(vars);
	if (!(array1 instanceof Array)) throw new Error(this.getOpName() + ": object 1 must be an array. Got a(n) " + typeof array1);
	if (!(array2 instanceof Array)) throw new Error(this.getOpName() + ": object 2 must be an array. Got a(n) " + typeof array1);

	var sizeOfArray1 = array1.length;
	var sizeOfArray2 = array2.length;
	var outerLoop = 0;
	var innerLoop = 0;
	for (outerLoop = 0; outerLoop < sizeOfArray1; outerLoop++) {
		for (innerLoop = 0; innerLoop < sizeOfArray2; innerLoop++) {
			if (array2[outerLoop] == array1[innerLoop])
				break;
		}

		/* If the above inner loop was not broken at all then
		 array2[i] is not present in array1[] */
		if (innerLoop == sizeOfArray2)
			return false;
	}

	/* If we reach here then all elements of array2[]
	 are present in array1[] */
	return true;
};

/** Register Expression */
Expression.registerExpression("$setissubset", base.parse(SetIsSubsetExpression));
