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

			"Should fail if array1 is not an array": function testArg1() {
				var array1 = "not an array",
					array2 = [6, 7, 8, 9],
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setIntersection", input, vps);
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
					expr = Expression.parseExpression("$setIntersection", input, vps);
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
					expr = Expression.parseExpression("$setIntersection", input, vps);
				assert.throws(function() {
					expr.evaluate({});
				});
			},

			"Should pass and return [2, 3]": function testBasicAssignment(){
				var array1 = [2,3],
					array2 = [1, 2, 3, 4, 5],
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setIntersection", input, vps),
					result = expr.evaluate({}),
					expected = [2, 3],
					msg = errMsg("$setIntersection", input, expr.serialize(false), expected, result);
				assert.deepEqual(result, expected, msg);
			},

			"Should pass and return []": function testBasicAssignment() {
				var array1 = [1, 2, 3, 4, 5],
					array2 = [7, 8, 9],
					input = [array1, array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setIntersection", input, vps),
					result = expr.evaluate({}),
					expected = [],
					msg = errMsg("$setIntersection", input, expr.serialize(false), expected, result);
				assert.deepEqual(result, expected, msg);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);