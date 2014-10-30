"use strict";

/**
 * Internal expression for constant values
 * @class ConstantExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var ConstantExpression = module.exports = function ConstantExpression(value){
    if (arguments.length !== 1) throw new Error("args expected: value");
    this.value = value; //TODO: actually make read-only in terms of JS?
    base.call(this);
}, klass = ConstantExpression, base = require("./Expression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});


// DEPENDENCIES
var Value = require("../Value"),
    Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$const";
};

/**
 * Get the constant value represented by this Expression.
 * @method getValue
 * @returns the value
 **/
proto.getValue = function getValue(){   //TODO: convert this to an instance field rather than a property
    return this.value;
};

proto.addDependencies = function addDependencies(deps, path) {
	// nothing to do
};

klass.parse = function parse(expr, vps){
    return new ConstantExpression(expr);
};

/**
 * Get the constant value represented by this Expression.
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars){
	return this.value;
};

proto.optimize = function optimize() {
	return this; // nothing to do
};

proto.serialize = function(rawValue){
	return rawValue ? {$const: this.value} : this.value;
};

//TODO: proto.addToBsonObj   --- may be required for $project to work -- my hope is that we can implement toJSON methods all around and use that instead
//TODO: proto.addToBsonArray

/** Register Expression */
Expression.registerExpression("$const",klass.parse(ConstantExpression));
Expression.registerExpression("$literal", klass.parse(ConstantExpression)); // alias
