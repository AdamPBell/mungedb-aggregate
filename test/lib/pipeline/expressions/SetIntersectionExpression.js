"use strict";
var assert = require("assert"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	SetIntersectionExpression = require("../../../../lib/pipeline/expressions/SetIntersectionExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


function errMsg(expr, args, tree, expected, result) {
	return 	"for expression " + expr +
		" with argument " + args +
		" full tree: " + JSON.stringify(tree) +
		" expected: " + expected +
		" result: " + result;
}

module.exports = {

	"SetIntersectionExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor() {
				assert.doesNotThrow(function() {
						new SetIntersectionExpression();
				});
			},

			"should throw Error when constructing with args": function testConstructor() {
				assert.throws(function() {
						new SetIntersectionExpression("someArg");
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $setIntersection": function testOpName() {
				assert.equal(new SetIntersectionExpression().getOpName(), "$setIntersection");
			}

		},

		"#evaluateInternal()": {

			beforeEach: function(){
				this.vps = new VariablesParseState(new VariablesIdGenerator());
				this.checkNotArray = function(array1, array2) {
					var input = [array1,array2],
						expr = Expression.parseExpression("$setIntersection", input, this.vps);
					assert.throws(function() {
						expr.evaluate({});
					});
				};
				this.checkIntersection = function(array1, array2, expected) {
					var input = [array1,array2],
						expr = Expression.parseExpression("$setIntersection", input, this.vps),
						result = expr.evaluate({}),
						msg = errMsg("$setIntersection", input, expr.serialize(false), expected, result);
					assert.deepEqual(result, expected, msg);
				};
				this.checkIntersectionBothWays = function(array1, array2, expected) {
					this.checkIntersection(array1, array2, expected);
					this.checkIntersection(array2, array1, expected);
				};
			},

			"Should fail if array1 is not an array": function testArg1() {
				this.checkNotArray("not an array", [6, 7, 8, 9]);
			},

			"Should fail if array2 is not an array": function testArg2() {
				this.checkNotArray([1, 2, 3, 4], "not an array");
			},

			"Should fail if both are not an array": function testArg1andArg2() {
				this.checkNotArray("not an array","not an array");
			},

			"Should pass and return [2, 3]": function testBasicAssignment(){
				this.checkIntersectionBothWays([2,3], [1, 2, 3, 4, 5], [2, 3]);
			},

			"Should pass and return []": function() {
				this.checkIntersectionBothWays([1, 2, 3, 4, 5], [7, 8, 9], []);
			},

			"Should handle when a set is empty": function() {
				this.checkIntersectionBothWays([], [7, 8, 9], []);
			},

			"Should work when we touch the ends": function() {
				this.checkIntersectionBothWays([7, 9], [7, 8, 9], [7, 9]);
			},

			"Should work when both sets are empty": function() {
				this.checkIntersectionBothWays([], [], []);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);