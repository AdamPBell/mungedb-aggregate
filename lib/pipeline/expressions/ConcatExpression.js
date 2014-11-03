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
	var n = this.operands.length,
		result = "";

	for (var i = 0; i < n; ++i){

		var value = this.operands[i].evaluateInternal(vars);

		if (value === null || value === undefined){
			return null;
		}

		if (typeof value !== "string"){
			throw new Error("uassert 16702: " + this.getOpName() + " only supports strings, not " + typeof value);
		}

		result = result.concat(value);
	}

	return result;
};

Expression.registerExpression(klass.opName, base.parse);
