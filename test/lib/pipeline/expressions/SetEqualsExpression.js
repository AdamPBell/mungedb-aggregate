"use strict";
var assert = require("assert"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	SetEqualsExpression = require("../../../../lib/pipeline/expressions/SetEqualsExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

function errMsg(expr, args, tree, expected, result) {
	return "for expression " + expr +
		" with argument " + args +
		" full tree: " + JSON.stringify(tree) +
		" expected: " + expected +
		" result: " + result;
}


module.exports = {

	"SetEqualsExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor() {
				assert.doesNotThrow(function() {
					new SetEqualsExpression();
				});
			},

			"should throw Error when constructing with args": function testConstructor() {
				assert.throws(function() {
						new SetEqualsExpression("someArg");
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $setEquals": function testOpName() {
				assert.equal(new SetEqualsExpression().getOpName(), "$setEquals");
			}

		},

		"#evaluateInternal()": {

			beforeEach: function () {
				this.compare = function (array1, array2, expected) {
					var input = [array1, array2],
						idGenerator = new VariablesIdGenerator(),
						vps = new VariablesParseState(idGenerator),
						expr = Expression.parseExpression("$setEquals", input, vps),
						result = expr.evaluate({}),
						msg = errMsg("$setEquals", input, expr.serialize(false), expected, result);
					assert.equal(result, expected, msg);
				};
				this.compareBothWays = function(array1, array2, expected) {
					this.compare(array1, array2, expected);
					this.compare(array2, array1, expected);
				}
			},

			"Should fail if array1 is not an array": function testArg1() {
				var array1 = "not an array",
					array2 = [6, 7, 8, 9],
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setEquals", input, vps);
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
					expr = Expression.parseExpression("$setEquals", input, vps);
				assert.throws(function() {
						expr.evaluate({});
				});
			},

			"Should fail if both are not an array": function testArg1andArg2() {
				var array1 = "not an array",
					array2 = "not an array",
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setEquals", input, vps);
				assert.throws(function() {
						expr.evaluate({});
				});
			},

			"Should pass and array1 should equal array2": function testBasicAssignment(){
				this.compareBothWays([1, 2, 3, 5, 4],[1, 3, 2, 4, 5], true);
			},

			"Should pass and array1 should not equal array2": function testBasicAssignment(){
				this.compareBothWays([1, 2, 3, 4],[1, 3, 2, 4, 5], false);
			},

			"Should respect empty sets": function(){
				this.compareBothWays([1],[], false);
			},

			"Should match empty sets": function(){
				this.compareBothWays([],[], true);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);