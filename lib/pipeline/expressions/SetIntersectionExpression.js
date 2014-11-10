"use strict";

/**
 * A $setintersection pipeline expression.
 * @class SetIntersectionExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var SetIntersectionExpression = module.exports = function SetIntersectionExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = SetIntersectionExpression, base = require("./VariadicExpressionT")(SetIntersectionExpression), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

var Value = require("../Value"),
	Expression = require("./Expression"),
	ValueSet = require("../ValueSet");

proto.evaluateInternal = function evaluateInternal(vars) {
	var n = this.operands.length,
		currentIntersection = new ValueSet();
	for (var i = 0; i < n; i++){
		var nextEntry = this.operands[i].evaluateInternal(vars);
		if (nextEntry === undefined || nextEntry === null){
			return null;
		}
		if (!(nextEntry instanceof Array))
			 throw new Error("All operands of " + this.getOpName() + "must be arrays. One " +
				"argument is of type: " + Value.getType(nextEntry) + "; uassert code 17047");

		if (i === 0){
			currentIntersection.insertRange(nextEntry);
		} else {
			var nextSet = new ValueSet(nextEntry);
			if (currentIntersection.size() > nextSet.size()) {
				// to iterate over whichever is the smaller set
				nextSet.swap(currentIntersection);
			}
			for (var itKey in currentIntersection.set) { //jshint ignore:line
				if (!nextSet.hasKey(itKey)) {
					currentIntersection.eraseKey(itKey);
				}
			}
		}
		if (currentIntersection.empty()) {
			break;
		}
	}
	var result = currentIntersection.values();
	return result;
};

Expression.registerExpression("$setIntersection", base.parse);

proto.getOpName = function getOpName() {
	return "$setIntersection";
};

proto.isAssociativeAndCommutative = function isAssociativeAndCommutative() {
	return true;
};
