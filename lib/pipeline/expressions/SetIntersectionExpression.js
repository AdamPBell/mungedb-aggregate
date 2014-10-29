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
	base.call(this);
}, klass = SetIntersectionExpression, base = require("./NaryBaseExpressionT")(SetIntersectionExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression"),
	Helpers = require("./Helpers");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$setIntersection";
};

/**
 * Takes any number of arrays. Returns the intersection of the arrays.
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
	var n = this.operands.length,
		currentIntersection = {};

	for (var i = 0; i < n; i++){

		var nextEntry = this.operands[i].evaluateInternal(vars);
		if (nextEntry == null || nextEntry == undefined){
			return null;
		}
		if (! (nextEntry instanceof Array )) throw new Error("Uassert 17047: All operands of " + this.getOpName() + "must be arrays. One argument is of type: " + typeof array1);

		if (i === 0){
			currentIntersection = Helpers.arrayToSet(nextEntry);
		} else {

			var nextSet = Helpers.arrayToSet(nextEntry);
			if (Object.keys(currentIntersection).length > Object.keys(nextSet).length){
				var temp = currentIntersection;
					currentIntersection = nextSet;
					nextSet = temp;
			}

			Object.keys(currentIntersection).forEach(function (key){
				if (Object.keys(nextSet).indexOf(key) < 0){
					delete currentIntersection[key]
				}
			});
		}

		if(currentIntersection === {}){
			break;
		}
	}

	var result = Helpers.setToArray(currentIntersection);

	return Value.consume(result);
};

/** Register Expression */
Expression.registerExpression("$setIntersection", base.parse);
