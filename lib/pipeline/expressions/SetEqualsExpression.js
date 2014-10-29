"use strict";

/**
 * A $setequals pipeline expression.
 * @see evaluateInternal
 * @class SetEqualsExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SetEqualsExpression = module.exports = function SetEqualsExpression() {
	if (arguments.length !== 0) throw new Error("Zero arguments expected. Got " + arguments.length);
	this.nargs = 2;

	base.call(this);
}, klass = SetEqualsExpression, base = require("./NaryBaseExpressionT")(SetEqualsExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$setequals";
};

proto.validateArguments = function validateArguments(args) {
	if (arguments.length < 2) throw new Error("Two or more arguments requird. Got " + arguments.length);
};
/**
 * Takes 2 arrays. Assigns the second array to the first array.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var array1 = this.operands[0].evaluateInternal(vars),
		array2 = this.operands[1].evaluateInternal(vars);
	if (!array1 instanceof Array) throw new Error(this.getOpName() + ": object 1 must be an array. Got a(n) " + typeof array1);
	if (!array2 instanceof Array) throw new Error(this.getOpName() + ": object 2 must be an array. Got a(n) " + typeof array1);
	array1 = array2;
	return array1;
};

/** Register Expression */
Expression.registerExpression("$setequals", base.parse);
