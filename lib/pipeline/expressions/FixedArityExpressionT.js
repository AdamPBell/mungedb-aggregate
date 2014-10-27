"use strict";

/**
 * A factory and base class for expressions that take a fixed number of arguments
 * @class FixedArityExpressionT
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/

var FixedArityExpressionT = module.exports = function FixedArityExpressionT(SubClass, nArgs) {

	var FixedArityExpression = function FixedArityExpression() {
		if (arguments.length !== 0) throw new Error(klass.name + "<" + SubClass.name + ">: zero args expected");
		base.call(this);
	}, klass = FixedArityExpression, base = require("./NaryExpressionBaseT")(SubClass), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});

	/**
	 * Check that the number of args is what we expected
	 * @method validateArguments
	 * @param args Array The array of arguments to the expression
	 * @throws
	 **/
	proto.validateArguments = function validateArguments(args) {
		if(args.length !== nArgs) {
			throw new Error("Expression " + this.getOpName() + " takes exactly " +
				nArgs + " arguments. " + args.length + " were passed in.")
		}
	};
	return FixedArityExpression;
};

