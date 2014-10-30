"use strict";
var assert = require("assert"),
		SetDifferenceExpression = require("../../../../lib/pipeline/expressions/SetDifferenceExpression"),
		VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
		VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
		Expression = require("../../../../lib/pipeline/expressions/Expression");

function errMsg(expr, args, tree, expected, result) {
	return 	"for expression " + expr +
			" with argument " + args +
			" full tree: " + JSON.stringify(tree) +
			" expected: " + expected +
			" result: " + result;
}

module.exports = {

	"SetDifferenceExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor() {
					assert.doesNotThrow(function() {
							new SetDifferenceExpression();
					});
			},

			"should throw Error when constructing with args": function testConstructor() {
					assert.throws(function() {
							new SetDifferenceExpression("someArg");
					});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $setDifference": function testOpName() {
					assert.equal(new SetDifferenceExpression().getOpName(), "$setDifference");
			}

		},

		"#evaluateInternal()": {

			"Should fail if array1 is not an array": function testArg2() {
				var array1 = "not and array",
					array2 = [1, 2, 3, 4],
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setDifference", input, vps);
				assert.throws(function() {
					expr.evaluate({});
				});
			},

			"Should fail if array2 is not an array": function testArg2() {
				var array1 = [1, 2, 3, 4],
					array2 = "not an array",
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setDifference", input, vps);
				assert.throws(function() {
					expr.evaluate({});
				});
			},

			"Should fail if both are not an arrays": function testArg1andArg2() {
				var array1 = "not an array",
					array2 = "not an array",
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setDifference", input, vps);
				assert.throws(function() {
					expr.evaluate({});
				});
			},

			"Should pass and return difference between the arrays": function testBasicAssignment(){
				var array1 = [1, 9, 2, 3, 4, 5],
					array2 = [5, 6, 7, 2, 8, 9],
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setDifference", input, vps),
					result = expr.evaluate({}),
					expected = [1, 3, 4],
					msg = errMsg("$setDifference", input, expr.serialize(false), expected, result);
				assert.deepEqual(result, expected, msg);
			},

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);