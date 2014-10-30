"use strict";
var assert = require("assert"),
	OrExpression = require("../../../../lib/pipeline/expressions/OrExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	CoerceToBoolExpression = require("../../../../lib/pipeline/expressions/CoerceToBoolExpression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator");


module.exports = {

	"OrExpression": {

		beforeEach: function() {
			this.vps = new VariablesParseState(new VariablesIdGenerator());
		},

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new OrExpression();
				});
			},

			"should throw Error when constructing with args": function testConstructor(){
				assert.throws(function(){
					new OrExpression(1);
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $or": function testOpName(){
				assert.equal(new OrExpression().getOpName(), "$or");
			}

		},

		"#evaluateInternalInternal()": {

			"should return false if no operands were given; {$or:[]}": function testEmpty(){
				assert.equal(Expression.parseOperand({$or:[]}, this.vps).evaluate(), false);
			},

			"should return true if operands is one true; {$or:[true]}": function testTrue(){
				assert.equal(Expression.parseOperand({$or:[true]}, this.vps).evaluate(), true);
			},

			"should return false if operands is one false; {$or:[false]}": function testFalse(){
				assert.equal(Expression.parseOperand({$or:[false]}, this.vps).evaluate(), false);
			},

			"should return true if operands are true or true; {$or:[true,true]}": function testTrueTrue(){
				assert.equal(Expression.parseOperand({$or:[true,true]}, this.vps).evaluate(), true);
			},

			"should return true if operands are true or false; {$or:[true,false]}": function testTrueFalse(){
				assert.equal(Expression.parseOperand({$or:[true,false]}, this.vps).evaluate(), true);
			},

			"should return true if operands are false or true; {$or:[false,true]}": function testFalseTrue(){
				assert.equal(Expression.parseOperand({$or:[false,true]}, this.vps).evaluate(), true);
			},

			"should return false if operands are false or false; {$or:[false,false]}": function testFalseFalse(){
				assert.equal(Expression.parseOperand({$or:[false,false]}, this.vps).evaluate(), false);
			},

			"should return false if operands are false, false, or false; {$or:[false,false,false]}": function testFalseFalseFalse(){
				assert.equal(Expression.parseOperand({$or:[false,false,false]}, this.vps).evaluate(), false);
			},

			"should return false if operands are false, false, or false; {$or:[false,false,true]}": function testFalseFalseTrue(){
				assert.equal(Expression.parseOperand({$or:[false,false,true]}, this.vps).evaluate(), true);
			},

			"should return true if operands are 0 or 1; {$or:[0,1]}": function testZeroOne(){
				assert.equal(Expression.parseOperand({$or:[0,1]}, this.vps).evaluate(), true);
			},

			"should return false if operands are 0 or false; {$or:[0,false]}": function testZeroFalse(){
				assert.equal(Expression.parseOperand({$or:[0,false]}, this.vps).evaluate(), false);
			},

			"should return true if operand is a path String to a truthy value; {$or:['$a']}": function testFieldPath(){
				assert.equal(Expression.parseOperand({$or:['$a']}, this.vps).evaluate({a:1}), true);
			}
		},

		"#optimize()": {

			"should optimize a constant expression to a constant; {$or:[1]} == true": function testOptimizeConstantExpression(){
				var a = Expression.parseOperand({$or:[1]}, this.vps).optimize();
				assert(a instanceof ConstantExpression);
				assert.equal(a.evaluateInternal(), true);
			},

			"should not optimize a non-constant expression; {$or:['$a']}; SERVER-6192": function testNonConstant(){
				var a = Expression.parseOperand({$or:['$a']}, this.vps).optimize();
				assert(a instanceof OrExpression);
				assert.equal(a.operands.length, 1);
			},

			"should optimize an expression with a path or a '1' (is entirely constant); {$or:['$a',1]}": function testNonConstantOne(){
				var a = Expression.parseOperand({$or:['$a',1]}, this.vps).optimize();
				assert(a instanceof ConstantExpression);
				assert.equal(a.evaluateInternal(), true);
			},

			"should optimize an expression with a field path or a '0'; {$or:['$a',0]}": function testNonConstantZero(){
				var a = Expression.parseOperand({$or:['$a',0]}, this.vps).optimize();
				assert(a instanceof CoerceToBoolExpression);
				assert.equal(a.expression._fieldPath.fieldNames[1], "a");
			},

			"should optimize an expression with two field paths or '1' (is entirely constant); {$or:['$a','$b',1]}": function testNonConstantNonConstantOne(){
				var a = Expression.parseOperand({$or:['$a','$b',1]}, this.vps).optimize();
				assert(a instanceof ConstantExpression);
				assert.equal(a.evaluateInternal(), true);
			},

			"should optimize an expression with two field paths or '0'; {$or:['$a','$b',0]}": function testNonConstantNonConstantZero(){
				var a = Expression.parseOperand({$or:['$a','$b',0]}, this.vps).optimize();
				assert(a instanceof OrExpression);
				assert.equal(a.operands.length, 2);
			},

			"should optimize an expression with '0', '1', or a field path; {$or:[0,1,'$a']}": function testZeroOneNonConstant(){
				var a = Expression.parseOperand({$or:[0,1,'$a']}, this.vps).optimize();
				assert(a instanceof ConstantExpression);
				assert.equal(a.evaluateInternal(), true);
			},

			"should optimize an expression with '0', '0', or a field path; {$or:[0,0,'$a']}": function testZeroZeroNonConstant(){
				var a = Expression.parseOperand({$or:[0,0,'$a']}, this.vps).optimize();
				assert(a instanceof CoerceToBoolExpression);
				assert.equal(a.expression._fieldPath.fieldNames[1], "a");
			},

			"should optimize nested $or expressions properly or optimize out values evaluating to false; {$or:[0,{$or:[0]},'$a','$b']}": function testNested(){
				var a = Expression.parseOperand({$or:[0,{$or:[0]},'$a','$b']}, this.vps).optimize();
				assert(a instanceof OrExpression);
				assert.equal(a.operands.length, 2);
			},

			"should optimize nested $or expressions containing a nested value evaluating to false; {$or:[0,{$or:[{$or:[1]}]},'$a','$b']}": function testNestedOne(){
				var a = Expression.parseOperand({$or:[0,{$or:[{$or:[1]}]},'$a','$b']}, this.vps).optimize();
				assert(a instanceof ConstantExpression);
				assert.equal(a.evaluateInternal(), true);
			},
			// Tests below this line are extras I added.  Just 'cause.
			"should handle a string of trues": function(){
				var a = Expression.parseOperand({$or:[1,"x",1,1,true]}, this.vps).optimize();
				assert(a instanceof ConstantExpression);
				assert.equal(a.evaluateInternal(), true);
			},
			"should handle a string of falses": function(){
				var a = Expression.parseOperand({$or:[0, false, 0, false, 0]}, this.vps).optimize();
				assert(a instanceof ConstantExpression);
				assert.equal(a.evaluateInternal(), false);
			},
			"should handle true + false": function(){
				var a = Expression.parseOperand({$or:[1, 0]}, this.vps).optimize();
				assert(a instanceof ConstantExpression);
				assert.equal(a.evaluateInternal(), true);
			},
			"should handle false + true": function(){
				var a = Expression.parseOperand({$or:[0, 1]}, this.vps).optimize();
				assert(a instanceof ConstantExpression);
				assert.equal(a.evaluateInternal(), true);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
