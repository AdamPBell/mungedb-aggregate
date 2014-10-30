"use strict";

/**
 * A $setunion pipeline expression.
 * @see evaluateInternal
 * @class SetUnionExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SetUnionExpression = module.exports = function SetUnionExpression() {
	this.nargs = 2;
	base.call(this);
}, klass = SetUnionExpression,
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
	return "$setUnion";
};

/**
 * Takes 2 objects. Unions the objects
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var object1 = this.operands[0].evaluateInternal(vars),
		object2 = this.operands[1].evaluateInternal(vars);
	if (object1 instanceof Array) throw new Error(this.getOpName() + ": object 1 must be an object");
	if (object2 instanceof Array) throw new Error(this.getOpName() + ": object 2 must be an object");

	var object3 = {};
	for (var attrname1 in object1) {
		object3[attrname1] = object1[attrname1];
	}
	for (var attrname2 in object2) {
		object3[attrname2] = object2[attrname2];
	}

	return object3;
};

/** Register Expression */
Expression.registerExpression("$setUnion", base.parse(SetUnionExpression));
