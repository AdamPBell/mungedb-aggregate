"use strict";
var assert = require("assert"),
	AndExpression = require("../../../../lib/pipeline/expressions/AndExpression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	CoerceToBoolExpression = require("../../../../lib/pipeline/expressions/CoerceToBoolExpression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"AndExpression": {

		beforeEach: function() {
			this.vps = new VariablesParseState(new VariablesIdGenerator());
		},

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new AndExpression();
				});
			},

			"should throw Error when constructing with args": function testConstructor(){
				assert.throws(function(){
					new AndExpression(1);
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
				assert.equal(Expression.parseOperand({$and:[]},this.vps).evaluate(), true);
			},

			"should return true if operands is one true; {$and:[true]}": function testTrue(){
				assert.equal(Expression.parseOperand({$and:[true]},this.vps).evaluate(), true);
			},

			"should return false if operands is one false; {$and:[false]}": function testFalse(){
				assert.equal(Expression.parseOperand({$and:[false]},this.vps).evaluate(), false);
			},

			"should return true if operands are true and true; {$and:[true,true]}": function testTrueTrue(){
				assert.equal(Expression.parseOperand({$and:[true,true]},this.vps).evaluate(), true);
			},

			"should return false if operands are true and false; {$and:[true,false]}": function testTrueFalse(){
				assert.equal(Expression.parseOperand({$and:[true,false]},this.vps).evaluate(), false);
			},

			"should return false if operands are false and true; {$and:[false,true]}": function testFalseTrue(){
				assert.equal(Expression.parseOperand({$and:[false,true]},this.vps).evaluate(), false);
			},

			"should return false if operands are false and false; {$and:[false,false]}": function testFalseFalse(){
				assert.equal(Expression.parseOperand({$and:[false,false]},this.vps).evaluate(), false);
			},

			"should return true if operands are true, true, and true; {$and:[true,true,true]}": function testTrueTrueTrue(){
				assert.equal(Expression.parseOperand({$and:[true,true,true]},this.vps).evaluate(), true);
			},

			"should return false if operands are true, true, and false; {$and:[true,true,false]}": function testTrueTrueFalse(){
				assert.equal(Expression.parseOperand({$and:[true,true,false]},this.vps).evaluate(), false);
			},

			"should return false if operands are 0 and 1; {$and:[0,1]}": function testZeroOne(){
				assert.equal(Expression.parseOperand({$and:[0,1]},this.vps).evaluate(), false);
			},

			"should return false if operands are 1 and 2; {$and:[1,2]}": function testOneTwo(){
				assert.equal(Expression.parseOperand({$and:[1,2]},this.vps).evaluate(), true);
			},

			"should return true if operand is a path String to a truthy value; {$and:['$a']}": function testFieldPath(){
				assert.equal(Expression.parseOperand({$and:['$a']},this.vps).evaluate({a:1}), true);
			}

		},

		"#optimize()": {

			"should optimize a constant expression to a constant; {$and:[1]} == true": function testOptimizeConstantExpression(){
				var a = Expression.parseOperand({$and:[1]}, this.vps).optimize();
				assert.equal(a.operands.length, 0, "The operands should have been optimized away");
				assert.equal(a.evaluateInternal(), true);
			},

			"should not optimize a non-constant expression; {$and:['$a']}": function testNonConstant(){
				var a = Expression.parseOperand({$and:['$a']}, this.vps).optimize();
				assert.equal(a.operands[0]._fieldPath.fieldNames.length, 2);
				assert.deepEqual(a.operands[0]._fieldPath.fieldNames[0], "CURRENT");
				assert.deepEqual(a.operands[0]._fieldPath.fieldNames[1], "a");
			},

			"should not optimize an expression ending with a non-constant. {$and:[1,'$a']};": function testConstantNonConstant(){
				var a = Expression.parseOperand({$and:[1,'$a']}, this.vps).optimize();
				assert(a instanceof CoerceToBoolExpression);
				assert(a.expression instanceof FieldPathExpression);

				assert.equal(a.expression._fieldPath.fieldNames.length, 2);
				assert.equal(a.expression._fieldPath.fieldNames[0], "CURRENT");
				assert.equal(a.expression._fieldPath.fieldNames[1], "a");
			},

			"should optimize an expression with a path and a '1'; {$and:['$a',1]}": function testNonConstantOne(){
				var a = Expression.parseOperand({$and:['$a', 1]}, this.vps).optimize();
				// The 1 should be removed as it is redundant.
				assert(a instanceof CoerceToBoolExpression, "The result should be forced to a boolean");

				// This is the '$a' which cannot be optimized.
				assert.equal(a.expression._fieldPath.fieldNames.length, 2);
				assert.equal(a.expression._fieldPath.fieldNames[0], "CURRENT");
				assert.equal(a.expression._fieldPath.fieldNames[1], "a");
			},

			"should optimize an expression with a field path and a '0'; {$and:['$a',0]}": function testNonConstantZero(){
				var a = Expression.parseOperand({$and:['$a',0]}, this.vps).optimize();
				assert.equal(a.operands.length, 0, "The operands should have been optimized away");
				assert.equal(a.evaluateInternal(), false, "The 0 operand should have been converted to false");
			},

			"should optimize an expression with two field paths and '1'; {$and:['$a','$b',1]}": function testNonConstantNonConstantOne(){
				var a = Expression.parseOperand({$and:['$a', '$b', 1]}, this.vps).optimize();
				assert.equal(a.operands.length, 2, "Two operands should remain.");

				// This is the '$a' which cannot be optimized.
				assert.deepEqual(a.operands[0]._fieldPath.fieldNames.length, 2);
				assert.deepEqual(a.operands[0]._fieldPath.fieldNames[0], "CURRENT");
				assert.deepEqual(a.operands[0]._fieldPath.fieldNames[1], "a");

				// This is the '$b' which cannot be optimized.
				assert.deepEqual(a.operands[1]._fieldPath.fieldNames.length, 2);
				assert.deepEqual(a.operands[1]._fieldPath.fieldNames[0], "CURRENT");
				assert.deepEqual(a.operands[1]._fieldPath.fieldNames[1], "b");
			},

			"should optimize an expression with two field paths and '0'; {$and:['$a','$b',0]}": function testNonConstantNonConstantZero(){
				var a = Expression.parseOperand({$and:['$a', '$b', 0]}, this.vps).optimize();
				assert(a instanceof ConstantExpression, "With that trailing false, we know the result...");
				assert.equal(a.operands.length, 0, "The operands should have been optimized away");
				assert.equal(a.evaluateInternal(), false);
			},

			"should optimize an expression with '0', '1', and a field path; {$and:[0,1,'$a']}": function testZeroOneNonConstant(){
				var a = Expression.parseOperand({$and:[0,1,'$a']}, this.vps).optimize();
				assert(a instanceof ConstantExpression);
				assert.equal(a.evaluateInternal(), false);
			},

			"should optimize an expression with '1', '1', and a field path; {$and:[1,1,'$a']}": function testOneOneNonConstant(){
				var a = Expression.parseOperand({$and:[1,1,'$a']}, this.vps).optimize();
				assert(a instanceof CoerceToBoolExpression);
				assert(a.expression instanceof FieldPathExpression);

				assert.equal(a.expression._fieldPath.fieldNames.length, 2);
				assert.equal(a.expression._fieldPath.fieldNames[0], "CURRENT");
				assert.equal(a.expression._fieldPath.fieldNames[1], "a");
			},

			"should optimize nested $and expressions properly and optimize out values evaluating to true; {$and:[1,{$and:[1]},'$a','$b']}": function testNested(){
				var a = Expression.parseOperand({$and:[1,{$and:[1]},'$a','$b']}, this.vps).optimize();
				assert.equal(a.operands.length, 2)
				assert(a.operands[0] instanceof FieldPathExpression);
				assert(a.operands[1] instanceof FieldPathExpression);
			},

			"should optimize nested $and expressions containing a nested value evaluating to false; {$and:[1,{$and:[1]},'$a','$b']}": function testNested(){
				//assert.deepEqual(Expression.parseOperand({$and:[1,{$and:[{$and:[0]}]},'$a','$b']}, this.vps).optimize().toJSON(true), {$const:false});
				var a = Expression.parseOperand({$and:[1,{$and:[{$and:[0]}]},'$a','$b']}, this.vps).optimize();
				assert(a instanceof ConstantExpression);
				assert.equal(a.evaluateInternal(), false);
			},

			"should optimize when the constants are on the right of the operand list. The rightmost is true": function(){
				// 1, "x", and 1 are all true.  They should be optimized away.
				var a = Expression.parseOperand({$and:['$a', 1, "x", 1]}, this.vps).optimize();
				assert(a instanceof CoerceToBoolExpression);
				assert(a.expression instanceof FieldPathExpression);

				assert.equal(a.expression._fieldPath.fieldNames.length, 2);
				assert.equal(a.expression._fieldPath.fieldNames[0], "CURRENT");
				assert.equal(a.expression._fieldPath.fieldNames[1], "a");
			},
			"should optimize when the constants are on the right of the operand list. The rightmost is false": function(){
				// 1, "x", and 1 are all true.  They should be optimized away.
				var a = Expression.parseOperand({$and:['$a', 1, "x", 0]}, this.vps).optimize();
				assert(a instanceof ConstantExpression, "The rightmost false kills it all");
				assert.equal(a.evaluateInternal(), false);
			}
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
