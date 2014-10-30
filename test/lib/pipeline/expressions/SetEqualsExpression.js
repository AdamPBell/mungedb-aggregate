"use strict";
var assert = require("assert"),
		SetEqualsExpression = require("../../../../lib/pipeline/expressions/SetEqualsExpression"),
		Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

		"SetEqualsExpression": {

				"constructor()": {

						"should throw Error when constructing without args": function testConstructor() {
								assert.throws(function() {
										new SetEqualsExpression();
								});
						}

				},

				"#getOpName()": {

						"should return the correct op name; $setequals": function testOpName() {
								assert.equal(new SetEqualsExpression([1,2,3],[4,5,6]).getOpName(), "$setequals");
						}

				},

				"#evaluateInternal()": {

						"Should fail if array1 is not an array": function testArg1() {
								var array1 = "not an array",
										array2 = [6, 7, 8, 9];
								assert.throws(function() {
										Expression.parseOperand({
												$setequals: ["$array1", "$array2"]
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
												$setequals: ["$array1", "$array2"]
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
												$setequals: ["$array1", "$array2"]
										}).evaluateInternal({
												array1: array1,
												array2: array2
										});
								});
						},

						"Should pass and array1 should equal array2": function testBasicAssignment() {
								var array1 = [1, 2, 3, 4],
										array2 = [6, 7, 8, 9];
								assert.strictEqual(Expression.parseOperand({
										$setequals: ["$array1", "$array2"]
								}).evaluateInternal({
										array1: array1,
										array2: array2
								}), [6, 7, 8, 9]);
						},

				}

		}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);