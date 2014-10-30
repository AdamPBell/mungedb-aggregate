"use strict";
var assert = require("assert"),
	CoerceToBoolExpression = require("../../../../lib/pipeline/expressions/CoerceToBoolExpression"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression");


module.exports = {

	"CoerceToBoolExpression": {

		"constructor()": {

			"should throw Error if no args": function construct(){
				assert.throws(function(){
					new CoerceToBoolExpression();
				});
			}

		},

		"#evaluate()": {

			"should return true if nested expression is coerced to true; {$const:5}": function testEvaluateTrue(){
				var expr = new CoerceToBoolExpression(new ConstantExpression(5));
				assert.equal(expr.evaluateInternal({}), true);
			},

			"should return false if nested expression is coerced to false; {$const:0}": function testEvaluateFalse(){
				var expr = new CoerceToBoolExpression(new ConstantExpression(0));
				assert.equal(expr.evaluateInternal({}), false);
			}

		},

		"#addDependencies()": {

			"should forward dependencies of nested expression": function testDependencies(){
				var expr = new CoerceToBoolExpression(new FieldPathExpression('a.b')),
					deps = expr.addDependencies({});
				assert.equal(Object.keys(deps).length, 1);
				assert.ok(deps['a.b']);
			}

		},

		"#toJSON()": {

			"should serialize as $and which will coerceToBool; '$foo'": function(){
				var expr = new CoerceToBoolExpression(new FieldPathExpression('foo'));
				assert.deepEqual(expr.toJSON(), {$and:['$foo']});
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
