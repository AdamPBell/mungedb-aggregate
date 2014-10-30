"use strict";
var assert = require("assert"),
		ToLowerExpression = require("../../../../lib/pipeline/expressions/ToLowerExpression"),
		Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

		"ToLowerExpression": {

				"constructor()": {

						"should not throw Error when constructing without args": function testConstructor() {
								assert.doesNotThrow(function() {
										new ToLowerExpression();
								});
						},

					"should throw Error when constructing with args": function testConstructor(){
						assert.throws(function(){
							new ToLowerExpression(1);
						});
					}

				},

				"#getOpName()": {

						"should return the correct op name; $toLower": function testOpName() {
								assert.equal(new ToLowerExpression().getOpName(), "$toLower");
						}

				},

				"#evaluate()": {

						"should return the lowercase version of the string if there is a null character in the middle of the string": function testStuff() {
								assert.strictEqual(Expression.parseOperand({
										$toLower: "$a"
								}).evaluate({
										a: "a\0B"
								}), "a\0b");
						},
						"should return the lowercase version of the string if there is a null character at the beginning of the string": function testStuff() {
								assert.strictEqual(Expression.parseOperand({
										$toLower: "$a"
								}).evaluate({
										a: "\0aB"
								}), "\0ab");
						},
						"should return the lowercase version of the string if there is a null character at the end of the string": function testStuff() {
								assert.strictEqual(Expression.parseOperand({
										$toLower: "$a"
								}).evaluate({
										a: "aB\0"
								}), "ab\0");
						}
				}

		}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);