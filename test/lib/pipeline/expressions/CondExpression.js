"use strict";
var assert = require("assert"),
	CondExpression = require("../../../../lib/pipeline/expressions/CondExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"CondExpression": {

		"constructor()": {

			"should throw Error when constructing without args": function testConstructor(){
				assert.throws(function(){
					new CondExpression();
				});
			},

			"should throw Error when constructing with 1 arg": function testConstructor1(){
				assert.throws(function(){
					new CondExpression({if:true === true});
				});
			},
			"should throw Error when constructing with 2 args": function testConstructor2(){
				assert.throws(function(){
					new CondExpression(true === true,1);
				});
			},
			"should now throw Error when constructing with 3 args": function testConstructor3(){
				assert.doesNotThrow(function(){
					//new CondExpression({$cond:[{"if":"true === true"},{"then":"1"},{"else":"0"}]});
					new CondExpression({$cond:[ true === true, 1, 0 ]});
				});
			},
		},

		"#getOpName()": {

			"should return the correct op name; $cond": function testOpName(){
				assert.equal(new CondExpression().getOpName(), "$cond");
			}

		},

		"#evaluateInternal()": {

			"should evaluate boolean expression as true, then return 1; [ true === true, 1, 0 ]": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$cond:[ true === true, 1, 0 ]}).evaluateInternal({}), 1);
			},

			"should evaluate boolean expression as false, then return 0; [ false === true, 1, 0 ]": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$cond:[ false === true, 1, 0 ]}).evaluateInternal({}), 0);
			}, 

			"should evaluate boolean expression as true, then return 1; [ (true === true) && true, 1, 0 ]": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$cond:[ (true === true) && true , 1, 0 ]}).evaluateInternal({}), 1);
			},

			"should evaluate boolean expression as false, then return 0; [ (false === true) && true, 1, 0 ]": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$cond:[ (false === true) && true, 1, 0 ]}).evaluateInternal({}), 0);
			},

			"should evaluate complex boolean expression as true, then return 1; [ ( 1 > 0 ) && (( 'a' == 'b' ) || ( 3 <= 5 )), 1, 0 ]": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$cond:[ ( 1 > 0 ) && (( 'a' == 'b' ) || ( 3 <= 5 )), 1, 0 ]}).evaluate({}), 1);
			},
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
