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
			}

		},

		"#getOpName()": {

			"should return the correct op name; $multiply": function testOpName(){
				assert.equal(new MultiplyExpression().getOpName(), "$multiply");
			}

		},

		"#getFactory()": {

			"should return the constructor for this class": function factoryIsConstructor(){
				assert.strictEqual(new MultiplyExpression().getFactory(), MultiplyExpression);
			}

		},

		"#evaluate()": {

			"should return result of multiplying numbers": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$multiply:["$a", "$b"]}).evaluate({a:1, b:2}), 1*2);
				assert.strictEqual(Expression.parseOperand({$multiply:["$a", "$b", "$c"]}).evaluate({a:1.345, b:2e45, c:0}), 1.345*2e45*0);
				assert.strictEqual(Expression.parseOperand({$multiply:["$a"]}).evaluate({a:1}), 1);
			},
			"should throw an exception if the result is not a number": function testStuff(){
				assert.throws(Expression.parseOperand({$multiply:["$a", "$b"]}).evaluate({a:1e199, b:1e199}));
			}
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
