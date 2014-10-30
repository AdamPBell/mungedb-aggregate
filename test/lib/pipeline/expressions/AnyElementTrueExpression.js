"use strict";
var assert = require("assert"),
	AnyElementTrueExpression = require("../../../../lib/pipeline/expressions/AnyElementTrueExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

var anyElementTrueExpression = new AnyElementTrueExpression();

module.exports = {

	"AnyElementTrueExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new AnyElementTrueExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $anyElement": function testOpName(){
				assert.equal(new AnyElementTrueExpression().getOpName(), "$anyElementTrue");
			}

		},

		"#evaluateInternal()": {

			"should return error if parameter is not an array": function testEmpty(){
				assert.throws(function(){
					anyElementTrueExpression.evaluateInternal("TEST");});
			},

			"should return true if only true was given a; {true}": function testEmpty(){
				assert.equal(anyElementTrueExpression.evaluateInternal({$anyElementTrue:[1,2,3,4]}), false);
			},

			"should return false if no element is true": function testEmpty(){
				assert.equal(anyElementTrueExpression.evaluateInternal({$anyElementTrue:[1,2,3,4]}), false);
			},

			"should return true if any element is true": function testEmpty(){
				assert.equal(anyElementTrueExpression.evaluateInternal({$anyElementTrue:[1,true,2,3,4]}), true);
			},

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
