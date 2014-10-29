"use strict";

/**
 * Create an expression that returns true exists in any element.
 * @class AnyElementTrueExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var AnyElementTrueExpression = module.exports = function AnyElementTrueExpression(){
	base.call(this);
},
	klass = AnyElementTrueExpression,
	FixedArityExpression = require("./FixedArityExpressionT")(klass, 1),
	base = FixedArityExpression,
	proto = klass.prototype = Object.create(base.prototype,{
		constructor:{
			value:klass
		}
	});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$anyElementTrue";
};

/**
 * Takes an array of one or more numbers and returns true if any.
 * @method @evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	if (!vars instanceof Array) throw new Error("$anyElementTrue requires an array");

	var total = 0;
	for (var i = 0, n = vars.length; i < n; ++i) {
		var value = vars[i].evaluateInternal([i]);
		if ( value.coerceToBool() )
			return true;
	}
	return false;
};

/** Register Expression */
Expression.registerExpression("$anyElementTrue",base.parse);
