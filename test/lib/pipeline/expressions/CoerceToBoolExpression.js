"use strict";
var assert = require("assert"),
	CoerceToBoolExpression = require("../../../../lib/pipeline/expressions/CoerceToBoolExpression"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression"),
	DepsTracker = require("../../../../lib/pipeline/DepsTracker");

function errMsg(expr, args, tree, expected, result) {
	return "for expression " + expr +
		" with argument " + args +
		" full tree: " + JSON.stringify(tree) +
		" expected: " + expected +
		" result: " + result;
}

module.exports = {

	"CoerceToBoolExpression": {

		"constructor()": {

			"should throw Error if no args": function construct(){
				assert.throws(function(){
					new CoerceToBoolExpression();
				});
			},

			"should throw Error if more than 1 arg": function construct(){
				assert.throws(function(){
					var a = b = "foo";
					new CoerceToBoolExpression(a,b);
				});
			},

			"should not throw Error if 1 arg": function construct(){
				assert.doesNotThrow(function(){
					var a = "foo";
					new CoerceToBoolExpression(a);
				});
			},

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

		/**
		 * These tests should just work after the FieldPathExpression Stuff is ported.
		**/

		"#serialize": {

			"should serialize as $and which will coerceToBool; '$foo'": function(){
				var expr = new CoerceToBoolExpression(new FieldPathExpression('foo', 'a'));
				assert.deepEqual(expr.serialize(), {$and:['$foo']});
			}

		},

		"#addDependencies()": {

			"should forward dependencies of nested expression": function testDependencies(){
				var nested = new FieldPathExpression.create("a.b"),
					expr = new CoerceToBoolExpression(nested),
					deps = new DepsTracker();
					expr.addDependencies(deps);
				assert.equal(Object.keys(deps).length, 1);
				assert.ok(deps['a.b']);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
