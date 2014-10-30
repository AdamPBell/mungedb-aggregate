"use strict";

var Expression = require("./Expression");

/**
 * Creates an expression that concatenates a set of string operands.
 * @class ConcatExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var ConcatExpression = module.exports = function ConcatExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = ConcatExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");
var Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$concat";
};

/**
 * Concats a string of values together.
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
    var n = this.operands.length;

    return this.operands.map(function(x) {
	var y = x.evaluateInternal(vars);
	if(typeof(y) !== "string") {
	    throw new Error("$concat only supports strings - 16702");
	}
	return y;
    }).join("");
};


Expression.registerExpression("$concat", base.parse(ConcatExpression));
