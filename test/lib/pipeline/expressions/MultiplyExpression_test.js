"use strict";
var assert = require("assert"),
	MultiplyExpression = require("../../../../lib/pipeline/expressions/MultiplyExpression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.MultiplyExpression = {

	beforeEach: function(){
		this.vps = new VariablesParseState(new VariablesIdGenerator());
	},

	"constructor()": {

		"should not throw Error when constructing without args": function() {
			assert.doesNotThrow(function(){
				new MultiplyExpression();
			});
		},

		"should throw Error when constructing with args": function() {
			assert.throws(function(){
				new MultiplyExpression(1);
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $multiply": function() {
			assert.equal(new MultiplyExpression().getOpName(), "$multiply");
		},

	},

	"#evaluate()": {

		"should multiply constants": function () {
			assert.strictEqual(Expression.parseOperand({$multiply: [2, 3, 4]}, this.vps).evaluate(), 2 * 3 * 4);
		},

		"should 'splode if an operand is a string": function () {
			assert.throws(function () {
				Expression.parseOperand({$multiply: [2, "x", 4]}, this.vps).evaluate();
			});
		},

		"should 'splode if an operand is a boolean": function () {
			assert.throws(function () {
				Expression.parseOperand({$multiply: [2, "x", 4]}, this.vps).evaluate();
			});
		},

		"should 'splode if an operand is a date": function () {
			assert.throws(function () {
				Expression.parseOperand({$multiply: [2, "x", 4]}, this.vps).evaluate();
			});
		},

		"should handle a null operand": function(){
			assert.strictEqual(Expression.parseOperand({$multiply: [2, null]}, this.vps).evaluate(), null);
		},

		"should handle an undefined operand": function(){
			assert.strictEqual(Expression.parseOperand({$multiply: [2, undefined]}, this.vps).evaluate(), null);
		},

		"should multiply mixed numbers": function () {
			assert.strictEqual(Expression.parseOperand({$multiply: [2.1, 3, 4.4]}, this.vps).evaluate(), 2.1 * 3 * 4.4);
		},

		"should return result of multiplying simple variables": function () {
			assert.equal(Expression.parseOperand({$multiply: ["$a", "$b"]}, this.vps).evaluate({a: 1, b: 2}), 1 * 2);
		},

		"should return result of multiplying large variables": function () {
			assert.strictEqual(Expression.parseOperand({$multiply: ["$a", "$b", "$c"]}, this.vps).evaluate({a: 1.345, b: 2e45, c: 0}), 1.345 * 2e45 * 0);
		},

		"should return result of multiplying one number": function () {
			assert.strictEqual(Expression.parseOperand({$multiply: ["$a"]}, this.vps).evaluate({a: 1}), 1);
		},

		"should throw an exception if the result is not a number": function () {
			assert.throws(function() {
				Expression.parseOperand({$multiply: ["$a", "$b"]}, this.vps).evaluate({a: 1e199, b: 1e199});
			});
		},

	},

	"optimize": {

		"should optimize out constants separated by a variable": function () {
			var a = Expression.parseOperand({$multiply: [2, 3, 4, 5, '$a', 6, 7, 8]}, this.vps).optimize();
			assert(a instanceof MultiplyExpression);
			assert.equal(a.operands.length, 2);
			assert(a.operands[0] instanceof FieldPathExpression);
			assert(a.operands[1] instanceof ConstantExpression);
			assert.equal(a.operands[1].evaluateInternal(), 2*3*4*5*6*7*8);
		},

	},

};
