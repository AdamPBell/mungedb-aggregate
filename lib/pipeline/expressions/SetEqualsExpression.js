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
	Expression = require("./Expression"),
	Helpers = require("./Helpers");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$setEquals";
};

proto.validateArguments = function validateArguments(args) {
	if (args.length < 2) throw new Error("Two or more arguments requird. Got " + arguments.length);
};
/**
 * Takes arrays. Returns true if the arrays have the same values (after duplicates are removed). Returns false otherwise.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var n = this.operands.length,
		lhs = [];

	for (var i = 0; i < n; i++){
		var nextEntry = this.operands[i].evaluateInternal(vars);

		if(!(nextEntry instanceof Array)) throw new Error("All operands of " + this.getOpName() +" must be arrays. One argument is of type: " + typeof nextEntry);

		if(i == 0){
			lhs = Helpers.arrayToSet(nextEntry);
		} else {
			var rhs = Helpers.arrayToSet(nextEntry);
			if (JSON.stringify(lhs) !== JSON.stringify(rhs)){
				return false;
			}
		}
	}
	return true;
};

/** Register Expression */
Expression.registerExpression("$setEquals", base.parse);
