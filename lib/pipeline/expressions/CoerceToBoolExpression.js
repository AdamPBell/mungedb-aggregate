"use strict";

/**
 * internal expression for coercing things to booleans
 * @class CoerceToBoolExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var CoerceToBoolExpression = module.exports = function CoerceToBoolExpression(expression){
	if (arguments.length !== 1) throw new Error("args expected: expression");
	this.expression = expression;
	base.call(this);
}, klass = CoerceToBoolExpression, base = require("./Expression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	AndExpression = require("./AndExpression"),
	OrExpression = require("./OrExpression"),
	NotExpression = require("./NotExpression"),
	Expression = require("./Expression");

proto.optimize = function optimize() {
	this.expression = this.expression.optimize();   // optimize the operand

	// if the operand already produces a boolean, then we don't need this
	// LATER - Expression to support a "typeof" query?
	var expr = this.expression;
	if(expr instanceof AndExpression ||
			expr instanceof OrExpression ||
			expr instanceof NotExpression ||
			expr instanceof CoerceToBoolExpression)
		return expr;
	return this;
};

proto.addDependencies = function addDependencies(deps, path) {
	return this.expression.addDependencies(deps);
};

// PROTOTYPE MEMBERS
proto.evaluateInternal = function evaluateInternal(vars){
	var result = this.expression.evaluateInternal(vars);
	return Value.coerceToBool(result);
};

proto.serialize = function serialize(explain) {
	if ( explain ) {
		return {$coerceToBool:[this.expression.toJSON()]};
	}
	else {
		return {$and:[this.expression.toJSON()]};
	}
};

proto.toJSON = function toJSON() {
	// Serializing as an $and expression which will become a CoerceToBool
	return {$and:[this.expression.toJSON()]};
};

//TODO: proto.addToBsonObj   --- may be required for $project to work
//TODO: proto.addToBsonArray
