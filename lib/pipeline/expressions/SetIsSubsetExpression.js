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
//	if (arguments.length !== 2) throw new Error("two args expected");
	base.call(this);
}, klass = SetIsSubsetExpression,
	FixedArityExpression = require("./FixedArityExpressionT")(klass, 2),
	base = FixedArityExpression,
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});


// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression"),
	Helpers = require("./Helpers");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$setissubset";
};


// lhs should be array, rhs should be set (object). See arrayToSet implementation.
var setIsSubsetHelper = function setIsSubsetHelper(lhs, rhs){
	var lset = Helpers.arrayToSet(lhs);
		rkeys = Object.keys(rhs);
	// do not shortcircuit when lhs.size() > rhs.size()
	// because lhs can have redundant entries
	Object.keys(lset).forEach(function (lkey){
		if (rkeys.indexOf(lkey) < 0){
			return false;
		}
	});

	return true;
};

/**
 * Takes 2 arrays. Returns true if the first is a subset of the second. Returns false otherwise.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var lhs = this.operands[0].evaluateInternal(vars),
		rhs = this.operands[1].evaluateInternal(vars);

	if (!(lhs instanceof Array)) throw new Error("Both operands of " + this.getOpName() + ": be arrays. First argument is of type " + typeof lhs);
	if (!(rhs instanceof Array)) throw new Error("Both operands of " + this.getOpName() + ": be arrays. First argument is of type " + typeof rhs);

	return setIsSubsetHelper(lhs, Helpers.arrayToSet(rhs));
};



var Optimized = function Optimized(cachedRhsSet, operands) {
	this.operands = operands;
	this._cachedRhsSet = cachedRhsSet;
}

Optimized.prototype = Object.create(SetIsSubsetExpression.prototype, {
	constructor: {
		value: Optimized
	}
});

Optimized.prototype.evaluateInternal = function evaluateInternal(vars){
	lhs = this.operands[0].evaluateInternal(vars);

	if (!(lhs instanceof Array)) throw new Error("uassert 17310: both operands of " + this.getOpName() + "  must be arrays. First argument is of type " + typeof lhs);
	
	return setIsSubsetHelper(lhs, this._cachedRhsSet);
};


proto.optimize = function optimize(cachedRhsSet, operands) {
	// perform basic optimizations
	//var optimized = base.optimize.call(this);
	var optimized = NaryExpression.optimize();

	// if NaryExpression.optimize() created a new value, return it directly
	if(optimized != this){
		return optimized;
	}

	if (this.operands[1] instanceof ConstantExpression){
		var ce = this.operands[1],
			rhs = ce.getValue();

		if (!(rhs instanceof Array)) throw new Error("uassert 17311: both operands of " + this.getOpName() + "  must be arrays. Second argument is of type " + typeof rhs);

		return new Optimized(Helpers.arrayToSet(rhs), this.operands);
	}

	return optimized;

};

/** Register Expression */
Expression.registerExpression("$setissubset", base.parse);
