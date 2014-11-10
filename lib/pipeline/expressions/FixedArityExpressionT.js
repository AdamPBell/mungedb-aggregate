"use strict";

/**
 * A factory and base class for expressions that take a fixed number of arguments
 * @class FixedArityExpressionT
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
module.exports = function FixedArityExpressionT(SubClass, nArgs) {
	if (arguments.length !== 2) throw new Error(klass.name + "<" + SubClass.name + ">: expected args: SubClass, nArgs");

	var FixedArityExpression = function FixedArityExpression() {
		if (arguments.length !== 0) throw new Error(klass.name + "<" + SubClass.name + ">: zero args expected");
		base.call(this);
	}, klass = FixedArityExpression, base = require("./NaryBaseExpressionT")(SubClass), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}}); //jshint ignore:line

	//NOTE: attach statics to emulate the C++ behavior
	for (var propName in base) //jshint ignore:line
		klass[propName] = base[propName];

	/**
	 * Check that the number of args is what we expected
	 * @method validateArguments
	 * @param args Array The array of arguments to the expression
	 * @throws
	 */
	proto.validateArguments = function validateArguments(args) {
		if(args.length !== nArgs) {
			throw new Error("Expression " + this.getOpName() + " takes exactly " +
				nArgs + " arguments. " + args.length + " were passed in.");
		}
	};

	return FixedArityExpression;
};
