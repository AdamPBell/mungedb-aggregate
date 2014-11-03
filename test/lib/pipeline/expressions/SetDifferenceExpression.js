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

			beforeEach: function(){
				this.compare = function(array1, array2, expected) {
					var input = [array1,array2],
						idGenerator = new VariablesIdGenerator(),
						vps = new VariablesParseState(idGenerator),
						expr = Expression.parseExpression("$setDifference", input, vps),
						result = expr.evaluate({}),
						msg = errMsg("$setDifference", input, expr.serialize(false), expected, result);
					assert.deepEqual(JSON.stringify(result), JSON.stringify(expected), msg);
				}
			},

			"Should fail if array1 is not an array": function testArg2() {
				var array1 = "not an array",
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
				this.compare([1, 9, 2, 3, 4, 5], [5, 6, 7, 2, 8, 9], [1, 3, 4]);
			},

			"Should handle an empty array 1": function(){
				this.compare([], [5, 6, 7, 2, 8, 9], []);
			},

			"should handle an empty array 2": function() {
				this.compare([1, 2, 3, "4"], [], [1, 2, 3, "4"]);
			},

			"should know the difference between a string and a number": function(){
				this.compare([1, 2], [1, "2"], [2]);
			},

			"should handle a null for Array1": function() {
				this.compare(null, [], null);
			},

			"should handle a null for Array2": function() {
				this.compare([], null, null);
			},

			"should handle duplicates in array1": function() {
				this.compare([1,1], [], [1]);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);