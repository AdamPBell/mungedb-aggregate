"use strict";
var assert = require("assert"),
	AndExpression = require("../../../../lib/pipeline/expressions/AndExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"AndExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new AndExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $and": function testOpName(){
				assert.equal(new AndExpression().getOpName(), "$and");
			}

		},


		"#evaluate()": {

			"should return true if no operands were given; {$and:[]}": function testEmpty(){
				assert.equal(Expression.parseOperand({$and:[]}).evaluate(), true);
			},

			"should return true if operands is one true; {$and:[true]}": function testTrue(){
				assert.equal(Expression.parseOperand({$and:[true]}).evaluate(), true);
			},

			"should return false if operands is one false; {$and:[false]}": function testFalse(){
				assert.equal(Expression.parseOperand({$and:[false]}).evaluate(), false);
			},

			"should return true if operands are true and true; {$and:[true,true]}": function testTrueTrue(){
				assert.equal(Expression.parseOperand({$and:[true,true]}).evaluate(), true);
			},

			"should return false if operands are true and false; {$and:[true,false]}": function testTrueFalse(){
				assert.equal(Expression.parseOperand({$and:[true,false]}).evaluate(), false);
			},

			"should return false if operands are false and true; {$and:[false,true]}": function testFalseTrue(){
				assert.equal(Expression.parseOperand({$and:[false,true]}).evaluate(), false);
			},

			"should return false if operands are false and false; {$and:[false,false]}": function testFalseFalse(){
				assert.equal(Expression.parseOperand({$and:[false,false]}).evaluate(), false);
			},

			"should return true if operands are true, true, and true; {$and:[true,true,true]}": function testTrueTrueTrue(){
				assert.equal(Expression.parseOperand({$and:[true,true,true]}).evaluate(), true);
			},

			"should return false if operands are true, true, and false; {$and:[true,true,false]}": function testTrueTrueFalse(){
				assert.equal(Expression.parseOperand({$and:[true,true,false]}).evaluate(), false);
			},

			"should return false if operands are 0 and 1; {$and:[0,1]}": function testZeroOne(){
				assert.equal(Expression.parseOperand({$and:[0,1]}).evaluate(), false);
			},

			"should return false if operands are 1 and 2; {$and:[1,2]}": function testOneTwo(){
				assert.equal(Expression.parseOperand({$and:[1,2]}).evaluate(), true);
			},

			"should return true if operand is a path String to a truthy value; {$and:['$a']}": function testFieldPath(){
				assert.equal(Expression.parseOperand({$and:['$a']}).evaluate({a:1}), true);
			}

		},

		"#optimize()": {

			"should optimize a constant expression to a constant; {$and:[1]} == true": function testOptimizeConstantExpression(){
				assert.deepEqual(Expression.parseOperand({$and:[1]}).optimize().toJSON(true), {$const:true});
			},

			"should not optimize a non-constant expression; {$and:['$a']}": function testNonConstant(){
				assert.deepEqual(Expression.parseOperand({$and:['$a']}).optimize().toJSON(), {$and:['$a']});
			},

			"optimize an expression beginning with a constant; {$and:[1,'$a']};": function testConstantNonConstant(){
				assert.deepEqual(Expression.parseOperand({$and:[1,'$a']}).optimize().toJSON(), {$and:[1,'$a']});
				assert.notEqual(Expression.parseOperand({$and:[1,'$a']}).optimize().toJSON(), {$and:[0,'$a']});
			},

			"should optimize an expression with a path and a '1' (is entirely constant); {$and:['$a',1]}": function testNonConstantOne(){
				assert.deepEqual(Expression.parseOperand({$and:['$a',1]}).optimize().toJSON(), {$and:['$a']});
			},

			"should optimize an expression with a field path and a '0'; {$and:['$a',0]}": function testNonConstantZero(){
				assert.deepEqual(Expression.parseOperand({$and:['$a',0]}).optimize().toJSON(true), {$const:false});
			},

			"should optimize an expression with two field paths and '1'; {$and:['$a','$b',1]}": function testNonConstantNonConstantOne(){
				assert.deepEqual(Expression.parseOperand({$and:['$a','$b',1]}).optimize().toJSON(), {$and:['$a','$b']});
			},

			"should optimize an expression with two field paths and '0'; {$and:['$a','$b',0]}": function testNonConstantNonConstantZero(){
				assert.deepEqual(Expression.parseOperand({$and:['$a','$b',0]}).optimize().toJSON(true), {$const:false});
			},

			"should optimize an expression with '0', '1', and a field path; {$and:[0,1,'$a']}": function testZeroOneNonConstant(){
				assert.deepEqual(Expression.parseOperand({$and:[0,1,'$a']}).optimize().toJSON(true), {$const:false});
			},

			"should optimize an expression with '1', '1', and a field path; {$and:[1,1,'$a']}": function testOneOneNonConstant(){
				assert.deepEqual(Expression.parseOperand({$and:[1,1,'$a']}).optimize().toJSON(), {$and:['$a']});
			},

			"should optimize nested $and expressions properly and optimize out values evaluating to true; {$and:[1,{$and:[1]},'$a','$b']}": function testNested(){
				assert.deepEqual(Expression.parseOperand({$and:[1,{$and:[1]},'$a','$b']}).optimize().toJSON(), {$and:['$a','$b']});
			},

			"should optimize nested $and expressions containing a nested value evaluating to false; {$and:[1,{$and:[1]},'$a','$b']}": function testNested(){
				assert.deepEqual(Expression.parseOperand({$and:[1,{$and:[{$and:[0]}]},'$a','$b']}).optimize().toJSON(true), {$const:false});
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
