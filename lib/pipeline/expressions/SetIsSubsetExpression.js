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

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$setissubset";
};

proto.optimize = function optimize(cachedRhsSet, operands) {

// This optimize needs to be done, eventually

// // perfore basic optimizations
//     intrusive_ptr<Expression> optimized = ExpressionNary::optimize();

//     // if ExpressionNary::optimize() created a new value, return it directly
//     if (optimized.get() != this)
//         return optimized;

//     if (ExpressionConstant* ec = dynamic_cast<ExpressionConstant*>(vpOperand[1].get())) {
//         const Value rhs = ec->getValue();
//         uassert(17311, str::stream() << "both operands of $setIsSubset must be arrays. Second "
//                                      << "argument is of type: " << typeName(rhs.getType()),
//                 rhs.getType() == Array);

//         return new Optimized(arrayToSet(rhs), vpOperand);
//     }

//     return optimized;

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
