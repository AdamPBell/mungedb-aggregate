"use strict";

/**
 * A $setintersection pipeline expression.
 * @see evaluateInternal
 * @class SetIntersectionExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SetIntersectionExpression = module.exports = function SetIntersectionExpression() {
	this.nargs = 2;
	base.call(this);
}, klass = SetIntersectionExpression,
	base = require("./NaryExpression"),
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$setIntersection";
};

/**
 * Takes 2 objects. Returns the intersects of the objects.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var object1 = this.operands[0].evaluateInternal(vars),
		object2 = this.operands[1].evaluateInternal(vars);
	if (object1 instanceof Array) throw new Error(this.getOpName() + ": object 1 must be an object");
	if (object2 instanceof Array) throw new Error(this.getOpName() + ": object 2 must be an object");

	var result = object1.filter(function(n) {
		return object2.indexOf(n) > -1;
	});
};

/** Register Expression */
Expression.registerExpression("$setIntersection", base.parse(SetIntersectionExpression));
