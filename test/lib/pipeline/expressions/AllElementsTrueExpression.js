"use strict";
var assert = require("assert"),
	AllElementsTrueExpression = require("../../../../lib/pipeline/expressions/AllElementsTrueExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

var allElementsTrueExpression = new AllElementsTrueExpression();

module.exports = {

	"AllElementsTrueExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor() {
				assert.doesNotThrow(function() {
					new AllElementsTrueExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $allElements": function testOpName() {
				assert.equal(new AllElementsTrueExpression().getOpName(), "$allElementsTrue");
			}

		},

		"#evaluateInternal()": {

			"should return error if parameter is empty:": function testEmpty() {
				assert.throws(function() {
					allElementsTrueExpression.evaluateInternal("asdf");
				});
			},

			"should return error if parameter is not an array": function testNonArray() {
				assert.throws(function() {
					allElementsTrueExpression.evaluateInternal("This is not an array");
				});
			},

			"should return false if first element is false; [false, true, true true]": function testFirstFalse() {
				assert.equal(allElementsTrueExpression.evaluateInternal(
					Expression.parseOperand({
						$allElementsTrue: [false, true, true, true]
					}).evaluate()), false);
			},

			"should return false if last element is false; [true, true, true, false]": function testLastFalse() {
				assert.equal(allElementsTrueExpression.evaluateInternal(
					Expression.parseOperand({
						$allElementsTrue: [true, true, true, false]
					}).evaluate()), false);
			},

			"should return true if all elements are true; [true,true,true,true]": function testAllTrue() {
				assert.equal(allElementsTrueExpression.evaluateInternal(
					Expression.parseOperand({
						$allElementsTrue: [true, true, true, true]
					}).evaluate()), true);
			},

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
