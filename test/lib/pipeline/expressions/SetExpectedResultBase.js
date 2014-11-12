"use strict";
var assert = require("assert"),
	SetDifferenceExpression = require("../../../../lib/pipeline/expressions/SetDifferenceExpression"), //jshint ignore:line
	SetIsSubsetExpression = require("../../../../lib/pipeline/expressions/SetIsSubsetExpression"), //jshint ignore:line
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

var ExpectedResultBase = module.exports = (function() { //jshint ignore:line

	var klass = function ExpectedResultBase(overrides) {
		//NOTE: DEVIATION FROM MONGO: using this base class to make things easier to initialize
		for (var key in overrides) //jshint ignore:line
			this[key] = overrides[key];
	}, proto = klass.prototype;
	proto.run = function() {
		var spec = this.getSpec,
			args = spec.input;
		if (spec.expected !== undefined && spec.expected !== null) {
			var fields = spec.expected;
			for (var fieldFirst in fields) { //jshint ignore:line
				var fieldSecond = fields[fieldFirst],
					expected = fieldSecond;
					// obj = {<fieldFirst>: args}; //NOTE: DEVIATION FROM MONGO: see parseExpression below
				var idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression(fieldFirst, args, vps),
					result = expr.evaluate({});
				if (result instanceof Array){
					result.sort();
				}
				var errMsg = "for expression " + fieldFirst +
					" with argument " + JSON.stringify(args) +
					" full tree: " + JSON.stringify(expr.serialize(false)) +
					" expected: " + JSON.stringify(expected) +
					" but got: " + JSON.stringify(result);
				assert.deepEqual(result, expected, errMsg);
				//TODO test optimize here
			}
		}
		if (spec.error !== undefined && spec.error !== null) {
			var asserters = spec.error,
				n = asserters.length;
			for (var i = 0; i < n; ++i) {
				// var obj2 = {<asserters[i]>: args}; //NOTE: DEVIATION FROM MONGO: see parseExpression below
				var idGenerator2 = new VariablesIdGenerator(),
					vps2 = new VariablesParseState(idGenerator2);
				assert.throws(function() {
					// NOTE: parse and evaluatation failures are treated the same
					expr = Expression.parseExpression(asserters[i], args, vps2);
					expr.evaluate({});
				}); // jshint ignore:line
			}
		}
	};
	return klass;
})();
