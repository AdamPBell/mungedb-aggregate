"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	SetEqualsExpression = require("../../../../lib/pipeline/expressions/SetEqualsExpression"),
	ExpectedResultBase = require("./SetExpectedResultBase");

exports.SetEqualsExpression = {

	"constructor()": {

		"should not throw Error when constructing without args": function() {
			assert.doesNotThrow(function() {
				new SetEqualsExpression();
			});
		},

		"should throw Error when constructing with args": function() {
			assert.throws(function() {
				new SetEqualsExpression("someArg");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $setEquals": function() {
			assert.equal(new SetEqualsExpression().getOpName(), "$setEquals");
		},

	},

	"#evaluate()": {

		"should handle when sets are the same": function Same(){
			new ExpectedResultBase({
				getSpec: {
					input: [[1, 2], [1, 2]],
					expected: {
						// $setIsSubset: true,
						$setEquals: true,
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
						// $setIsSubset: true,
						$setEquals: true,
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
						// $setIsSubset: true,
						$setEquals: true,
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
						// $setIsSubset: false,
						$setEquals: false,
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
						// $setIsSubset: false,
						$setEquals: false,
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
						// $setIsSubset: true,
						$setEquals: false,
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
						// $setIsSubset: true,
						$setEquals: true,
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
						// $setIsSubset: false,
						$setEquals: false,
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
						// $setIsSubset: false,
						$setEquals: false,
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
						"$setEquals"
						// "$setIsSubset"
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
						"$setEquals"
						// "$setIsSubset"
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
						"$setEquals"
						// "$setIsSubset"
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
						"$setEquals"
						// "$setIsSubset"
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
						"$setEquals"
						// "$setIsSubset"
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
						"$setEquals"
						// "$setIsSubset"
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
						// $setIsSubset: false,
						$setEquals: false,
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
						$setEquals: false,
						// $setUnion: [3, 8, 11, 34, 80.3, "asdf", "foo", "yay"],
					},
					error: [
						// "$setIsSubset",
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
						$setEquals: true,
						// $setUnion: [1, 2, 4],
					},
					error: [
						// "$setIsSubset",
						// "$setDifference",
					],
				},
			}).run();
		},

	},

};
