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
}, klass = ConcatExpression, base = require("./VariadicExpressionT")(ConcatExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");
var Expression = require("./Expression");

// PROTOTYPE MEMBERS
klass.opName = "$concat";
proto.getOpName = function getOpName(){
	return klass.opName;
};

/**
 * Concats a string of values together.
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
    return this.operands.map(function(x) {
		var y = x.evaluateInternal(vars);
		if(typeof(y) !== "string") {
	    	throw new Error("$concat only supports strings, not "+typeof(y)+"; code 16702");
		}
	return y;
    }).join("");
};

Expression.registerExpression(klass.opName, base.parse);
