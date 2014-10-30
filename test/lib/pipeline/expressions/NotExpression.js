"use strict";
var assert = require("assert"),
	NotExpression = require("../../../../lib/pipeline/expressions/NotExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"NotExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new NotExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $not": function testOpName(){
				assert.equal(new NotExpression().getOpName(), "$not");
			}

		},

		"#evaluateInternal()": {

			"should return false for a true input; false for true": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$not:true}).evaluateInternal({}), false);
			},

			"should return true for a false input; true for false": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$not:false}).evaluateInternal({}), true);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
