"use strict";
var assert = require("assert"),
		IfNullExpression = require("../../../../lib/pipeline/expressions/IfNullExpression"),
		Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

		"IfNullExpression": {

				"constructor()": {

						"should not throw Error when constructing without args": function testConstructor() {
								assert.doesNotThrow(function() {
										new IfNullExpression();
								});
						}

				},

				"#getOpName()": {

						"should return the correct op name; $ifNull": function testOpName() {
								assert.equal(new IfNullExpression().getOpName(), "$ifNull");
						}

				},

				"#evaluateInternal()": {

						"should return the left hand side if the left hand side is not null or undefined": function testStuff() {
								assert.strictEqual(Expression.parseOperand({
										$ifNull: ["$a", "$b"]
								}).evaluateInternal({
										a: 1,
										b: 2
								}), 1);
						},
						"should return the right hand side if the left hand side is null or undefined": function testStuff() {
								assert.strictEqual(Expression.parseOperand({
										$ifNull: ["$a", "$b"]
								}).evaluateInternal({
										a: null,
										b: 2
								}), 2);
								assert.strictEqual(Expression.parseOperand({
										$ifNull: ["$a", "$b"]
								}).evaluateInternal({
										b: 2
								}), 2);
						}
				}

		}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);