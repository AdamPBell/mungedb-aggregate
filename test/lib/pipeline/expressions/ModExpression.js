"use strict";
var assert = require("assert"),
	ModExpression = require("../../../../lib/pipeline/expressions/ModExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"ModExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new ModExpression();
				});
			}

		},

		"#getOpName()": {
			"should return the correct op name; $mod": function testOpName(){
				assert.equal(new ModExpression().getOpName(), "$mod");
			}

		},

		"#evaluateInternal()": {
			"should return rhs if rhs is undefined or null": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$mod:["$lhs", "$rhs"]}, new VariablesParseState()).evaluate({lhs:20.453, rhs:null}), null);
				assert.strictEqual(Expression.parseOperand({$mod:["$lhs", "$rhs"]}).evaluate({lhs:20.453}), undefined);
			},
			"should return lhs if lhs is undefined or null": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$mod:["$lhs", "$rhs"]}).evaluate({lhs:null, rhs:20.453}), null);
				assert.strictEqual(Expression.parseOperand({$mod:["$lhs", "$rhs"]}).evaluate({rhs:20.453}), undefined);
			},
			"should return undefined if rhs is 0": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$mod:["$lhs", "$rhs"]}).evaluate({lhs:20.453, rhs:0}), undefined);
			},
			"should return proper mod of rhs and lhs if both are numbers": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$mod:["$lhs", "$rhs"]}).evaluate({lhs:234.4234, rhs:45}), 234.4234 % 45);
				assert.strictEqual(Expression.parseOperand({$mod:["$lhs", "$rhs"]}).evaluate({lhs:0, rhs:45}), 0 % 45);
				assert.strictEqual(Expression.parseOperand({$mod:["$lhs", "$rhs"]}).evaluate({lhs:-6, rhs:-0.5}), -6 % -0.5);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
