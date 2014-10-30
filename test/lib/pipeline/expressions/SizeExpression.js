"use strict";
var assert = require("assert"),
		SizeExpression = require("../../../../lib/pipeline/expressions/SizeExpression"),
		Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

		"SizeExpression": {

				"constructor()": {

						"should throw Error when constructing without args": function testConstructor() {
								assert.throws(function() {
										new SizeExpression();
								});
						}

				},

				"#getOpName()": {

						"should return the correct op name; $size": function testOpName() {
								assert.equal(new SizeExpression("test").getOpName(), "$size");
						}

				},

				"#evaluateInternal()": {

						// New test not working
						"should return the size": function testSize() {
								assert.strictEqual(Expression.parseOperand({
										$size: ["$a"]
								}).evaluateInternal({
										a: [{a:1},{b:2}],
										b: [{c:3}]
								}), 4);
						}
				}

		}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);