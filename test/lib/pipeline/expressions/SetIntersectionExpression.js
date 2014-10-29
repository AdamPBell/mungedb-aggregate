"use strict";
var assert = require("assert"),
		SetIntersectionExpression = require("../../../../lib/pipeline/expressions/SetIntersectionExpression"),
		Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

		"SetIntersectionExpression": {

				"constructor()": {

						"should throw Error when constructing without args": function testConstructor() {
								assert.throws(function() {
										new SetIntersectionExpression();
								});
						}

				},

				"#getOpName()": {

						"should return the correct op name; $setIntersection": function testOpName() {
								assert.equal(new SetIntersectionExpression([1, 2, 3], [4, 5, 6]).getOpName(), "$setIntersection");
						}

				},

				"#evaluateInternal()": {

						"Should fail if array1 is not an array": function testArg1() {
								var array1 = "not an array",
										array2 = [6, 7, 8, 9];
								assert.throws(function() {
										Expression.parseOperand({
												$setIntersection: ["$array1", "$array2"]
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
												$setIntersection: ["$array1", "$array2"]
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
												$setIntersection: ["$array1", "$array2"]
										}).evaluateInternal({
												array1: array1,
												array2: array2
										});
								});
						},

						"Should pass and return an interested set1": function testBasicAssignment() {
								var array1 = {
										"a": "3",
										"c": "4"
								},
										array2 = {
												"a": "3",
												"b": "3"
										};
								assert.strictEqual(Expression.parseOperand({
										$setIntersection: ["$array1", "$array2"]
								}).evaluateInternal({
										array1: array1,
										array2: array2
								}), {
										"a": "3"
								});
						},

						"Should pass and return an intersected set1": function testBasicAssignment() {
								var array1 = [1, 2, 3, 4, 5],
										array2 = [2, 3, 6, 7, 8];
								assert.strictEqual(Expression.parseOperand({
										$setIntersection: ["$array1", "$array2"]
								}).evaluateInternal({
										array1: array1,
										array2: array2
								}), [2, 3]);
						},

						"Should pass and return an intersected set2": function testBasicAssignment() {
								var array1 = [1, 2, 3, 4, 5],
										array2 = [7, 8, 9];
								assert.strictEqual(Expression.parseOperand({
										$setIntersection: ["$array1", "$array2"]
								}).evaluateInternal({
										array1: array1,
										array2: array2
								}), []);
						},

				}

		}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);