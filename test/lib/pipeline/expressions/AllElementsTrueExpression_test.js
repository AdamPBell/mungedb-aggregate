"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	AllElementsTrueExpression = require("../../../../lib/pipeline/expressions/AllElementsTrueExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

var ExpectedResultBase = (function() {
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
					result = expr.evaluate({}),
					errMsg = "for expression " + fieldFirst +
							" with argument " + JSON.stringify(args) +
							" full tree " + JSON.stringify(expr.serialize(false)) +
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

exports.AllElementsTrueExpression = {

	"constructor()": {

		"should construct instance": function() {
			assert(new AllElementsTrueExpression() instanceof AllElementsTrueExpression);
			assert(new AllElementsTrueExpression() instanceof Expression);
		},

		"should error if given args": function() {
			assert.throws(function() {
				new AllElementsTrueExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $allElementsTrue": function() {
			assert.equal(new AllElementsTrueExpression().getOpName(), "$allElementsTrue");
		},

	},

	"#evaluate()": {

		"should return false if just false": function JustFalse() {
			new ExpectedResultBase({
				getSpec: {
					input: [[false]],
					expected: {
						$allElementsTrue: false,
						// $anyElementTrue: false,
					}
				}
			}).run();
		},

		"should return true if just true": function JustTrue() {
			new ExpectedResultBase({
				getSpec: {
					input: [[true]],
					expected: {
						$allElementsTrue: true,
						// $anyElementTrue: true,
					}
				}
			}).run();
		},

		"should return false if one true and one false": function OneTrueOneFalse() {
			new ExpectedResultBase({
				getSpec: {
					input: [[true, false]],
					expected: {
						$allElementsTrue: false,
						// $anyElementTrue: true,
					}
				}
			}).run();
		},

		"should return true if empty": function Empty() {
			new ExpectedResultBase({
				getSpec: {
					input: [[]],
					expected: {
						$allElementsTrue: true,
						// $anyElementTrue: false,
					}
				}
			}).run();
		},

		"should return true if truthy int": function TrueViaInt() {
			new ExpectedResultBase({
				getSpec: {
					input: [[1]],
					expected: {
						$allElementsTrue: true,
						// $anyElementTrue: true,
					}
				}
			}).run();
		},

		"should return false if falsy int": function FalseViaInt() {
			new ExpectedResultBase({
				getSpec: {
					input: [[0]],
					expected: {
						$allElementsTrue: false,
						// $anyElementTrue: false,
					}
				}
			}).run();
		},

		"should error if given null instead of array": function FalseViaInt() {
			new ExpectedResultBase({
				getSpec: {
					input: [null],
					error: [
						"$allElementsTrue",
						// "$anyElementTrue",
					]
				}
			}).run();
		},

	},

};
