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
	base.call(this);
}, klass = SetUnionExpression, base = require("./NaryBaseExpressionT")(SetUnionExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$setUnion";
};

/**
 * Takes 2 objects. Returns the union of the two objects.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {

	var unionSet = {};

	var object1 = this.operands[0].evaluateInternal(vars),
		object2 = this.operands[1].evaluateInternal(vars);

	//Deviation from Mongo. We are using objects for this, while they use arrays. 
	if (typeof object1 != object) throw new Error("All operands of " + this.getOpName() + "must be objects. First argument is of type: " + typeof object1);
	if (typeof object2 != object) throw new Error("All operands of " + this.getOpName() + "must be objects. Second argument is of type: " + typeof object2);

	for (var attrname1 in object1) {
		unionSet[attrname1] = object1[attrname1];
	}
	for (var attrname2 in object2) {
		unionSet[attrname2] = object2[attrname2];
	}

	return unionSet;
};

/** Register Expression */
Expression.registerExpression("$setUnion", base.parse);
