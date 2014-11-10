"use strict";

/**
 * A $setissubset pipeline expression.
 * @see evaluateInternal
 * @class SetIsSubsetExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var SetIsSubsetExpression = module.exports = function SetIsSubsetExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = SetIsSubsetExpression, base = require("./FixedArityExpressionT")(SetIsSubsetExpression, 2), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

var Value = require("../Value"),
	Expression = require("./Expression"),
	NaryExpression = require("./NaryExpression"),
	ConstantExpression = require("./ConstantExpression"),
	ValueSet = require("../ValueSet");

function setIsSubsetHelper(lhs, rhs) { //NOTE: vector<Value> &lhs, ValueSet &rhs
	// do not shortcircuit when lhs.size() > rhs.size()
	// because lhs can have redundant entries
	for (var i = 0; i < lhs.length; i++) {
		if (!rhs.has(lhs[i])) {
			return false;
		}
	}
	return true;
}

proto.evaluateInternal = function evaluateInternal(vars) {
	var lhs = this.operands[0].evaluateInternal(vars),
		rhs = this.operands[1].evaluateInternal(vars);

	if (!(lhs instanceof Array))
		throw new Error("both operands of " + this.getOpName() + ": must be arrays. First " +
			"argument is of type " + Value.getType(lhs) + "; uassert code 17046");
	if (!(rhs instanceof Array))
		throw new Error("both operands of " + this.getOpName() + ": must be arrays. Second " +
			"argument is of type " + Value.getType(rhs) + "; code 17042");

	return setIsSubsetHelper(lhs, new ValueSet(rhs));
};


/**
 * This class handles the case where the RHS set is constant.
 *
 * Since it is constant we can construct the hashset once which makes the runtime performance
 * effectively constant with respect to the size of RHS. Large, constant RHS is expected to be a
 * major use case for $redact and this has been verified to improve performance significantly.
 */
function Optimized(cachedRhsSet, operands) {
	this._cachedRhsSet = cachedRhsSet;
	this.operands = operands;
}
Optimized.prototype = Object.create(SetIsSubsetExpression.prototype, {constructor:{value:Optimized}});
Optimized.prototype.evaluateInternal = function evaluateInternal(vars){
	var lhs = this.operands[0].evaluateInternal(vars);

	if (!(lhs instanceof Array))
		throw new Error("both operands of " + this.getOpName() + " must be arrays. First " +
			"argument is of type: " + Value.getType(lhs) + "; uassert code 17310");

	return setIsSubsetHelper(lhs, this._cachedRhsSet);
};


proto.optimize = function optimize(cachedRhsSet, operands) { //jshint ignore:line
	// perform basic optimizations
	var optimized = NaryExpression.optimize();

	// if ExpressionNary::optimize() created a new value, return it directly
	if(optimized !== this)
		return optimized;

	var ce;
	if ((ce = this.operands[1] instanceof ConstantExpression ? this.operands[1] : undefined)){
		var rhs = ce.getValue();
		if (!(rhs instanceof Array))
			throw new Error("both operands of " + this.getOpName() + " must be arrays. Second " +
				"argument is of type " + Value.getType(rhs) + "; uassert code 17311");

		return new Optimized(new ValueSet(rhs), this.operands);
	}

	return optimized;
};

Expression.registerExpression("$setIsSubset", base.parse);

proto.getOpName = function getOpName() {
	return "$setIsSubset";
};
