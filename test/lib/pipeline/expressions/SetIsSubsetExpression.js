"use strict";
var assert = require("assert"),
		SetIsSubsetExpression = require("../../../../lib/pipeline/expressions/SetIsSubsetExpression"),
		Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

		"SetIsSubsetExpression": {

				"constructor()": {

						"should throw Error when constructing without args": function testConstructor() {
								assert.throws(function() {
										new SetIsSubsetExpression();
								});
						}

				},

				"#getOpName()": {

						"should return the correct op name; $setissubset": function testOpName() {
								assert.equal(new SetIsSubsetExpression([1,2,3],[4,5,6]).getOpName(), "$setissubset");
						}

				},

				"#evaluateInternal()": {

						"Should fail if array1 is not an array": function testArg1() {
								var array1 = "not an array",
										array2 = [6, 7, 8, 9];
								assert.throws(function() {
										Expression.parseOperand({
												$setissubset: ["$array1", "$array2"]
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
												$setissubset: ["$array1", "$array2"]
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
												$setissubset: ["$array1", "$array2"]
										}).evaluateInternal({
												array1: array1,
												array2: array2
										});
								});
						},

						"Should pass and return a true": function testBasicAssignment() {
								var array1 = [1, 2, 3, 4, 5],
										array2 = [2,3];
								assert.strictEqual(Expression.parseOperand({
										$setissubset: ["$array1", "$array2"]
								}).evaluateInternal({
										array1: array1,
										array2: array2
								}), true);
						},

						"Should pass and return false": function testBasicAssignment() {
								var array1 = [1, 2, 3, 4, 5],
										array2 = [7, 8, 9];
								assert.strictEqual(Expression.parseOperand({
										$setissubset: ["$array1", "$array2"]
								}).evaluateInternal({
										array1: array1,
										array2: array2
								}), true);
						},

				}

		}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);