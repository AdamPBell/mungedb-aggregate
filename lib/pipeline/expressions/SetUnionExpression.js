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
	if(arguments.length != 0) throw new Error("SetUnionExpression constructor takes no args");
	base.call(this);
}, klass = SetUnionExpression, base = require("./VariadicExpressionT")(SetUnionExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression"),
	Helpers = require("./Helpers");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName() {
	return "$setUnion";
};

/**
 * Takes arrays. Returns the union of the arrays (arrays treated as sets, so duplicates are ignored).
 * @method evaluateInternal
 **/
proto.evaluateInternal = function evaluateInternal(vars) {

	var unionSet = {}, 
		n = this.operands.length;

	for (var i = 0; i < n; i++){
		var newEntries = this.operands[i].evaluateInternal(vars);
		if (newEntries === null || newEntries === undefined){
			return null;
		}
		if (!(newEntries instanceof Array)) throw new Error("Uassert 17043: All operands of " + this.getOpName() + "must be arrays. One argument is of type: " + typeof newEntries)
		
		var len = newEntries.length;
		for (var j = 0; j < len; j++){
			unionSet[newEntries[j]] = newEntries[j];
		}
	}
	var result = Helpers.setToArray(unionSet);
	return Value.consume(result);

};

/** Register Expression */
Expression.registerExpression("$setUnion", base.parse);
