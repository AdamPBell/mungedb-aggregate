"use strict";
var assert = require("assert"),
		SetUnionExpression = require("../../../../lib/pipeline/expressions/SetUnionExpression"),
		Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

		"SetUnionExpression": {

				"constructor()": {

						"should throw Error when constructing without args": function testConstructor() {
								assert.throws(function() {
										new SetUnionExpression();
								});
						}

				},

				"#getOpName()": {

						"should return the correct op name; $setUnion": function testOpName() {
								assert.equal(new SetUnionExpression([1, 2, 3], [4, 5, 6]).getOpName(), "$setUnion");
						}

				},

				"#evaluateInternal()": {

						"Should fail if array1 is not an array": function testArg1() {
								var array1 = "not an array",
										array2 = [6, 7, 8, 9];
								assert.throws(function() {
										Expression.parseOperand({
												$setUnion: ["$array1", "$array2"]
										}).evaluateInternal({
												array1: array1,
												array2: array2
										});
								});
						},

						"Should fail if array2 is not an array": function testArg2() {
								var array1 = [1, 2, 3, 4],
										array2 = "not an array";
								assert.throws(function() {
										Expression.parseOperand({
												$setUnion: ["$array1", "$array2"]
										}).evaluateInternal({
												array1: array1,
												array2: array2
										});
								});
						},

						"Should fail if both are not an array": function testArg1andArg2() {
								var array1 = "not an array",
										array2 = "not an array";
								assert.throws(function() {
										Expression.parseOperand({
												$setUnion: ["$array1", "$array2"]
										}).evaluateInternal({
												array1: array1,
												array2: array2
										});
								});
						},

						"Should pass and return a unioned set1": function testBasicAssignment() {
								var array1 = {
										"a": "3",
										"c": "4"
								},
										array2 = {
												"a": "3",
												"b": "3"
										};
								assert.strictEqual(Expression.parseOperand({
										$setUnion: ["$array1", "$array2"]
								}).evaluateInternal({
										array1: array1,
										array2: array2
								}), {
										"a": "3",
										"c": "4",
										"b": "3"
								});
						},

						"Should pass and return a unioned set": function testBasicAssignment() {
								var array1 = [1, 2, 3, 4, 5],
										array2 = [2, 3, 6, 7, 8];
								assert.strictEqual(Expression.parseOperand({
										$setUnion: ["$array1", "$array2"]
								}).evaluateInternal({
										array1: array1,
										array2: array2
								}), [1, 2, 3, 4, 5, 6, 7, 8]);
						},

						"Should pass and return unioned set": function testBasicAssignment() {
								var array1 = [1, 2, 3, 4, 5],
										array2 = [7, 8, 9];
								assert.strictEqual(Expression.parseOperand({
										$setUnion: ["$array1", "$array2"]
								}).evaluateInternal({
										array1: array1,
										array2: array2
								}), [1, 2, 3, 4, 5, 7, 8, 9]);
						},

				}

		}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);