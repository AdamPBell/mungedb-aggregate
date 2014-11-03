"use strict";
var assert = require("assert"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	SetIsSubsetExpression = require("../../../../lib/pipeline/expressions/SetIsSubsetExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

var ExpectedResultBase = (function() {
	var klass = function ExpectedResultBase(overrides) {
		//NOTE: DEVIATION FROM MONGO: using this base class to make things easier to initialize
		for (var key in overrides)
			this[key] = overrides[key];
	}, proto = klass.prototype;
	proto.run = function() {
		var spec = this.getSpec,
			args = spec.input;
		if (spec.expected !== undefined && spec.expected !== null) {
			var fields = spec.expected;
			for (var fieldFirst in fields) {
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

exports.SetIsSubsetExpression = {

	"constructor()": {

		"should not throw Error when constructing without args": function() {
			assert.doesNotThrow(function() {
				new SetIsSubsetExpression();
			});
		},

		"should throw Error when constructing with args": function() {
			assert.throws(function() {
				new SetIsSubsetExpression("someArg");
			});
		}

	},

	"#getOpName()": {

		"should return the correct op name; $setIsSubset": function() {
			assert.equal(new SetIsSubsetExpression().getOpName(), "$setIsSubset");
		}

	},

	"#evaluate()": {

		"should handle when sets are the same": function Same(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1, 2], [1, 2]],
					expected: {
						$setIsSubset: true,
						// $setEquals: true,
						// $setIntersection: [1, 2],
						// $setUnion: [1, 2],
						// $setDifference: [],
					},
				},
			}).run();
		},

		"should handle when the 2nd set has redundant items": function Redundant(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1, 2], [1, 2, 2]],
					expected: {
						$setIsSubset: true,
						// $setEquals: true,
						// $setIntersection: [1, 2],
						// $setUnion: [1, 2],
						// $setDifference: [],
					},
				},
			}).run();
		},

		"should handle when the both sets have redundant items": function DoubleRedundant(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1, 1, 2], [1, 2, 2]],
					expected: {
						$setIsSubset: true,
						// $setEquals: true,
						// $setIntersection: [1, 2],
						// $setUnion: [1, 2],
						// $setDifference: [],
					},
				},
			}).run();
		},

		"should handle when the 1st set is a superset": function Super(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1, 2], [1]],
					expected: {
						$setIsSubset: false,
						// $setEquals: false,
						// $setIntersection: [1],
						// $setUnion: [1, 2],
						// $setDifference: [2],
					},
				},
			}).run();
		},

		"should handle when the 2nd set is a superset and has redundant items": function SuperWithRedundant(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1, 2, 2], [1]],
					expected: {
						$setIsSubset: false,
						// $setEquals: false,
						// $setIntersection: [1],
						// $setUnion: [1, 2],
						// $setDifference: [2],
					},
				},
			}).run();
		},

		"should handle when the 1st set is a subset": function Sub(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1], [1, 2]],
					expected: {
						$setIsSubset: true,
						// $setEquals: false,
						// $setIntersection: [1],
						// $setUnion: [1, 2],
						// $setDifference: [],
					},
				},
			}).run();
		},

		"should handle when the sets are the same but backwards": function SameBackwards(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1, 2], [2, 1]],
					expected: {
						$setIsSubset: true,
						// $setEquals: true,
						// $setIntersection: [1, 2],
						// $setUnion: [1, 2],
						// $setDifference: [],
					},
				},
			}).run();
		},

		"should handle when the sets do not overlap": function NoOverlap(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1, 2], [8, 4]],
					expected: {
						$setIsSubset: false,
						// $setEquals: false,
						// $setIntersection: [],
						// $setUnion: [1, 2, 4, 8],
						// $setDifference: [1, 2],
					},
				},
			}).run();
		},

		"should handle when the sets do overlap": function Overlap(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1, 2], [8, 2, 4]],
					expected: {
						$setIsSubset: false,
						// $setEquals: false,
						// $setIntersection: [2],
						// $setUnion: [1, 2, 4, 8],
						// $setDifference: [1],
					},
				},
			}).run();
		},

		"should handle when the 2nd set is null": function LastNull(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1, 2], null],
					expected: {
						// $setIntersection: null,
						// $setUnion: null,
						// $setDifference: null,
					},
					error: [
						// "$setEquals"
						"$setIsSubset"
					],
				},
			}).run();
		},

		"should handle when the 1st set is null": function FirstNull(){
			new ExpectedResultBase({
				getSpec: {
					input: [null, [1, 2]],
					expected: {
						// $setIntersection: null,
						// $setUnion: null,
						// $setDifference: null,
					},
					error: [
						// "$setEquals"
						"$setIsSubset"
					],
				},
			}).run();
		},

		"should handle when the input has no args": function NoArg(){
			new ExpectedResultBase({
				getSpec: {
					input: [],
					expected: {
						// $setIntersection: [],
						// $setUnion: [],
					},
					error: [
						// "$setEquals"
						"$setIsSubset"
						// "$setDifference"
					],
				},
			}).run();
		},

		"should handle when the input has one arg": function OneArg(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1, 2]],
					expected: {
						// $setIntersection: [1, 2],
						// $setUnion: [1, 2],
					},
					error: [
						// "$setEquals"
						"$setIsSubset"
						// "$setDifference"
					],
				},
			}).run();
		},

		"should handle when the input has empty arg": function EmptyArg(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1, 2]],
					expected: {
						// $setIntersection: [1, 2],
						// $setUnion: [1, 2],
					},
					error: [
						// "$setEquals"
						"$setIsSubset"
						// "$setDifference"
					],
				},
			}).run();
		},

		"should handle when the input has empty left arg": function LeftArgEmpty(){
			new ExpectedResultBase({
				getSpec: {
					input: [[]],
					expected: {
						// $setIntersection: [],
						// $setUnion: [],
					},
					error: [
						// "$setEquals"
						"$setIsSubset"
						// "$setDifference"
					],
				},
			}).run();
		},

		"should handle when the input has empty right arg": function RightArgEmpty(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1, 2], []],
					expected: {
						// $setIntersection: [],
						// $setUnion: [1, 2],
						$setIsSubset: false,
						// $setEquals: false,
						// $setDifference: [1, 2],
					},
				},
			}).run();
		},

		"should handle when the input has many args": function ManyArgs(){
			new ExpectedResultBase({
				getSpec: {
					input: [[8, 3], ["asdf", "foo"], [80.3, 34], [], [80.3, "foo", 11, "yay"]],
					expected: {
						// $setIntersection: [],
						// $setEquals: false,
						// $setUnion: [3, 8, 11, 34, 80.3, "asdf", "foo", "yay"],
					},
					error: [
						"$setIsSubset",
						// "$setDifference",
					],
				},
			}).run();
		},

		"should handle when the input has many args that are equal sets": function ManyArgsEqual(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1, 2, 4], [1, 2, 2, 4], [4, 1, 2], [2, 1, 1, 4]],
					expected: {
						// $setIntersection: [1, 2, 4],
						// $setEquals: false,
						// $setUnion: [1, 2, 4],
					},
					error: [
						"$setIsSubset",
						// "$setDifference",
					],
				},
			}).run();
		},

	},

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
