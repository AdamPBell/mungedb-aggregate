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

	if (!(lhs instanceof Array)) throw new Error("uassert 17046: both operands of " + this.getOpName() + "  must be arrays. Second argument is of type " + typeof lhs);
	
	return setIsSubsetHelper(lhs, this._cachedRhsSet);
};

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression"),
	Helpers = require("./Helpers.js");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$setissubset";
};

proto.optimize = function optimize(cachedRhsSet, operands) {

	// perform basic optimizations
	var optimized = base.optimize.call(this);

	// if NaryExpression.optimize() created a new value, return it directly
	if(optimized != this){
		return optimized;
	}

	if (operands[1] instanceof ConstantExpression){
		var ce = operands[1],
			rhs = ce.getValue();

		if (!(rhs instanceof Array)) throw new Error("uassert 17311: both operands of " + this.getOpName() + "  must be arrays. Second argument is of type " + typeof rhs);

		return new Optimized(Helpers.arrayToSet(rhs), this.operands);
	}

	return optimized;

};

/**
 * Takes 2 arrays. Returns true if the first is a subset of the second. Returns false otherwise.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var lhs = this.operands[0].evaluateInternal(vars),
		rhs = this.operands[1].evaluateInternal(vars);
	if (!(lhs instanceof Array)) throw new Error(this.getOpName() + ": object 1 must be an array. Got a(n) " + typeof lhs);
	if (!(rhs instanceof Array)) throw new Error(this.getOpName() + ": object 2 must be an array. Got a(n) " + typeof rhs);

	return setIsSubsetHelper(lhs, Helpers.arrayToSet(rhs));
};

/** Register Expression */
Expression.registerExpression("$setissubset", base.parse(SetIsSubsetExpression));
