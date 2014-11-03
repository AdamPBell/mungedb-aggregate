"use strict";
var assert = require("assert"),
	ConcatExpression = require("../../../../lib/pipeline/expressions/ConcatExpression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"ConcatExpression": {
		beforeEach: function(){
			this.vps = new VariablesParseState(new VariablesIdGenerator());
		},

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new ConcatExpression();
				});
			},
			"should throw Error when constructing with args": function testConstructor(){
				assert.throws(function(){
					new ConcatExpression("should die");
				});
			}
		},

		"#getOpName()": {

			"should return the correct op name; $concat": function testOpName(){
				assert.equal(new ConcatExpression().getOpName(), "$concat");
			}

		},

		"#evaluate()": {

			"should return empty string if no operands were given; {$concat:[]}": function testEmpty(){
				assert.equal(Expression.parseOperand({$concat:[]}, this.vps).evaluate(), "");
			},

			"should return mystring if operands are my string; {$concat:[my, string]}": function testConcat(){
				assert.equal(Expression.parseOperand({$concat:["my", "string"]}, this.vps).evaluate(), "mystring");
			},

			"should return mystring if operands are my and $a; {$concat:[my,$a]}": function testFieldPath(){
				assert.equal(Expression.parseOperand({$concat:["my","$a"]}, this.vps).evaluate({a:"string"}), "mystring");
			},
			"should return null if an operand evaluates to null; {$concat:[my,$a]}": function testNull(){
				var a = Expression.parseOperand({$concat:["my","$a"]}, this.vps);
				var b = a.evaluate({a:null});
				assert.equal(b, null);
			},
			"should throw if an operand is a number": function testNull(){
				assert.throws(function(){
					Expression.parseOperand({$concat:["my","$a"]}, this.vps).evaluate({a:100});
				});
			},
			"should throw if an operand is a date": function testNull(){
				assert.throws(function(){
					Expression.parseOperand({$concat:["my","$a"]}, this.vps).evaluate({a:new Date()});
				});
			},
			"should throw if an operand is a boolean": function testNull(){
				assert.throws(function(){
					Expression.parseOperand({$concat:["my","$a"]}, this.vps).evaluate({a:true});
				});
			}
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
