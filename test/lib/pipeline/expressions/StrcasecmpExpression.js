"use strict";
var assert = require("assert"),
	StrcasecmpExpression = require("../../../../lib/pipeline/expressions/StrcasecmpExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"StrcasecmpExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new StrcasecmpExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $strcasecmp": function testOpName(){
				assert.equal(new StrcasecmpExpression().getOpName(), "$strcasecmp");
			}

		},

		"#getFactory()": {

			"should return the constructor for this class": function factoryIsConstructor(){
				assert.strictEqual(new StrcasecmpExpression().getFactory(), undefined);
			}

		},

		"#evaluateInternal()": {

			"should return 0 if the strings are equivalent and begin with a null character": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$strcasecmp:["$a", "$b"]}).evaluateInternal({a:"\0ab", b:"\0AB"}), 0);
			},
			"should return 0 if the strings are equivalent and end with a null character": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$strcasecmp:["$a", "$b"]}).evaluateInternal({a:"ab\0", b:"AB\0"}), 0);
			},
			"should return -1 if the left hand side is less than the right hand side and both contain a null character": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$strcasecmp:["$a", "$b"]}).evaluateInternal({a:"a\0a", b:"A\0B"}), -1);
			},
			"should return 0 if the strings are equivalent and both contain a null character": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$strcasecmp:["$a", "$b"]}).evaluateInternal({a:"a\0b", b:"A\0B"}), 0);
			},
			"should return 1 if the left hand side is greater than the right hand side and both contain a null character": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$strcasecmp:["$a", "$b"]}).evaluateInternal({a:"a\0c", b:"A\0B"}), 1);
			}
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
