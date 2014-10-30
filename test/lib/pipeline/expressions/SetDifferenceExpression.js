"use strict";
var assert = require("assert"),
		SetDifferenceExpression = require("../../../../lib/pipeline/expressions/SetDifferenceExpression"),
		Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

		"SetDifferenceExpression": {

				"constructor()": {

						"should throw Error when constructing without args": function testConstructor() {
								assert.throws(function() {
										new SetDifferenceExpression();
								});
						}

				},

				"#getOpName()": {

						"should return the correct op name; $setdifference": function testOpName() {
								assert.equal(new SetDifferenceExpression([1, 2, 3], [4, 5, 6]).getOpName(), "$setdifference");
						}

				},

				"#evaluateInternal()": {

						"Should fail if array1 is not an array": function testArg1() {
								var array1 = "not an array",
										array2 = [6, 7, 8, 9];
								assert.throws(function() {
										Expression.parseOperand({
												$setdifference: ["$array1", "$array2"]
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
												$setdifference: ["$array1", "$array2"]
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
												$setdifference: ["$array1", "$array2"]
										}).evaluateInternal({
												array1: array1,
												array2: array2
										});
								});
						},

						"Should pass and return a difference between the arrays": function testBasicAssignment() {
								var array1 = [1, 9, 2, 3, 4, 5],
										array2 = [5, 6, 7, 2, 8, 9];
								assert.strictEqual(Expression.parseOperand({
										$setdifference: ["$array1", "$array2"]
								}).evaluateInternal({
										array1: array1,
										array2: array2
								}), [1, 3, 4, 6, 7, 8]);
						},

				}

		}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);