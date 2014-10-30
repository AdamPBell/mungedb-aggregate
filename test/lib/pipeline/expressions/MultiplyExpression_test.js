"use strict";
var assert = require("assert"),
	MultiplyExpression = require("../../../../lib/pipeline/expressions/MultiplyExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"MultiplyExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new MultiplyExpression();
				});
			},

			"should throw Error when constructing with args": function testConstructor(){
				assert.throws(function(){
					new MultiplyExpression(1);
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $multiply": function testOpName(){
				assert.equal(new MultiplyExpression().getOpName(), "$multiply");
			}

		},

		"#evaluate()": {

			"should return result of multiplying numbers": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$multiply:["$a", "$b"]}).evaluateInternal({a:1, b:2}), 1*2);
				assert.strictEqual(Expression.parseOperand({$multiply:["$a", "$b", "$c"]}).evaluateInternal({a:1.345, b:2e45, c:0}), 1.345*2e45*0);
				assert.strictEqual(Expression.parseOperand({$multiply:["$a"]}).evaluateInternal({a:1}), 1);
			},
			"should throw an exception if the result is not a number": function testStuff(){
				assert.throws(Expression.parseOperand({$multiply:["$a", "$b"]}).evaluateInternal({a:1e199, b:1e199}));
			}
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
