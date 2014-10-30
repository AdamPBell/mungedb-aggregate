"use strict";
var assert = require("assert"),
	AddExpression = require("../../../../lib/pipeline/expressions/AddExpression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression");


//TODO: refactor these test cases using Expression.parseOperand() or something because these could be a whole lot cleaner...
module.exports = {

	"AddExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new AddExpression();
				});
			},

			"should throw Error when constructing with args": function testConstructor(){
				assert.throws(function(){
					new AddExpression(1);
				});
			}
		},

		"#getOpName()": {

			"should return the correct op name; $add": function testOpName(){
				assert.equal(new AddExpression().getOpName(), "$add");
			}

		},

		"#evaluateInternal()": {

			"should return the operand if null document is given": function nullDocument(){
				var expr = new AddExpression();
				expr.addOperand(new ConstantExpression(2));
				assert.equal(expr.evaluateInternal(null), 2);
			},

			"should return 0 if no operands were given": function noOperands(){
				var expr = new AddExpression();
				assert.equal(expr.evaluateInternal({}), 0);
			},

			"should throw Error if a Date operand was given": function date(){
				var expr = new AddExpression();
				expr.addOperand(new ConstantExpression(new Date()));
				assert.throws(function(){
					expr.evaluateInternal({});
				});
			},

			"should throw Error if a String operand was given": function string(){
				var expr = new AddExpression();
				expr.addOperand(new ConstantExpression(""));
				assert.throws(function(){
					expr.evaluateInternal({});
				});
			},

			"should throw Error if a Boolean operand was given": function bool() {
				var expr = new AddExpression();
				expr.addOperand(new ConstantExpression(true));
				assert.throws(function() {
					expr.evaluateInternal({});
				});
			},

			"should pass thru a single number": function number() {
				var expr = new AddExpression(),
					input = 123,
					expected = 123;
				expr.addOperand(new ConstantExpression(input));
				assert.equal(expr.evaluateInternal({}), expected);
			},

			"should pass thru a single null": function nullSupport() {
				var expr = new AddExpression(),
					input = null,
					expected = 0;
				expr.addOperand(new ConstantExpression(input));
				assert.equal(expr.evaluateInternal({}), expected);
			},

			"should pass thru a single undefined": function undefinedSupport() {
				var expr = new AddExpression(),
					input,
					expected = 0;
				expr.addOperand(new ConstantExpression(input));
				assert.equal(expr.evaluateInternal({}), expected);
			},

			"should add two numbers": function numbers() {
				var expr = new AddExpression(),
					inputs = [1, 5],
					expected = 6;
				inputs.forEach(function(input) {
					expr.addOperand(new ConstantExpression(input));
				});
				assert.equal(expr.evaluateInternal({}), expected);
			},

			"should add a number and a null": function numberAndNull() {
				var expr = new AddExpression(),
					inputs = [1, null],
					expected = 1;
				inputs.forEach(function(input) {
					expr.addOperand(new ConstantExpression(input));
				});
				assert.equal(expr.evaluateInternal({}), expected);
			},

			"should add a number and an undefined": function numberAndUndefined() {
				var expr = new AddExpression(),
					inputs = [1, undefined],
					expected = 1;
				inputs.forEach(function(input) {
					expr.addOperand(new ConstantExpression(input));
				});
				assert.equal(expr.evaluateInternal({}), expected);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
