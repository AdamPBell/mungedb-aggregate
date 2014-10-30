"use strict";
var assert = require("assert"),
		SubstrExpression = require("../../../../lib/pipeline/expressions/SubstrExpression"),
		Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

		"SubstrExpression": {

				"constructor()": {

						"should not throw Error when constructing without args": function testConstructor() {
								assert.doesNotThrow(function() {
										new SubstrExpression();
								});
						}

				},

				"#getOpName()": {

						"should return the correct op name; $substr": function testOpName() {
								assert.equal(new SubstrExpression().getOpName(), "$substr");
						}

				},

				"#evaluateInternal()": {

						"Should fail if no end argument is given": function testMissing3rdArg() {
								var s = "mystring",
										start = 0,
										end = s.length;
								assert.throws(function() {
										Expression.parseOperand({
												$substr: ["$s", "$start"]
										}).evaluateInternal({
												s: s,
												start: start
										});
								});
						},

						"Should return entire string when called with 0 and length": function testWholeString() {
								var s = "mystring",
										start = 0,
										end = s.length;
								assert.strictEqual(Expression.parseOperand({
										$substr: ["$s", "$start", "$end"]
								}).evaluateInternal({
										s: s,
										start: start,
										end: end
								}), "mystring");
						},

						"Should return entire string less the last character when called with 0 and length-1": function testLastCharacter() {
								var s = "mystring",
										start = 0,
										end = s.length;
								assert.strictEqual(Expression.parseOperand({
										$substr: ["$s", "$start", "$end"]
								}).evaluateInternal({
										s: s,
										start: start,
										end: end - 1
								}), "mystrin");
						},

						"Should return empty string when 0 and 0 are given as indexes": function test00Indexes() {
								var s = "mystring",
										start = 0,
										end = 0;
								assert.strictEqual(Expression.parseOperand({
										$substr: ["$s", "$start", "$end"]
								}).evaluateInternal({
										s: s,
										start: start,
										end: end
								}), "");
						},

						"Should first character when 0 and 1 are given as indexes": function testFirstCharacter() {
								var s = "mystring",
										start = 0,
										end = 1;
								assert.strictEqual(Expression.parseOperand({
										$substr: ["$s", "$start", "$end"]
								}).evaluateInternal({
										s: s,
										start: start,
										end: end
								}), "m");
						},

						"Should return empty string when empty string is given": function testEmptyString() {
								var s = "",
										start = 0,
										end = 0;
								assert.strictEqual(Expression.parseOperand({
										$substr: ["$s", "$start", "$end"]
								}).evaluateInternal({
										s: s,
										start: start,
										end: end
								}), "");
						},

						"Should return the entire string if end is -1": function testIndexTooLarge() {
								var s = "mystring",
										start = 0,
										end = -1;
								assert.strictEqual(Expression.parseOperand({
										$substr: ["$s", "$start", "$end"]
								}).evaluateInternal({
										s: s,
										start: start,
										end: end
								}), "mystring");
						},


						"Should fail if end is before begin": function testUnorderedIndexes() {
								var s = "mystring",
										start = s.length,
										end = 0;
								assert.throws(function() {
										Expression.parseOperand({
												$substr: ["$s", "$start"]
										}).evaluateInternal({
												s: s,
												start: start,
												end: end
										});
								});
						},

						"Should fail if end is greater than length": function testIndexTooLarge() {
								var s = "mystring",
										start = 0,
										end = s.length + 1;
								assert.throws(function() {
										Expression.parseOperand({
												$substr: ["$s", "$start"]
										}).evaluateInternal({
												s: s,
												start: start,
												end: end
										});
								});
						},


				}

		}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);