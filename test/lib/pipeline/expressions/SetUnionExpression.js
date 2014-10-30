"use strict";
var assert = require("assert"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	SetUnionExpression = require("../../../../lib/pipeline/expressions/SetUnionExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

function errMsg(expr, args, tree, expected, result) {
	return "for expression " + expr +
		" with argument " + args +
		" full tree: " + JSON.stringify(tree) +
		" expected: " + expected +
		" result: " + result;
}

module.exports = {

	"SetUnionExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor() {
				assert.doesNotThrow(function() {
						new SetUnionExpression();
				});
			},

			"should throw Error when constructing with args": function testConstructor() {
				assert.throws(function() {
						new SetUnionExpression("someArg");
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $setUnion": function testOpName() {
				assert.equal(new SetUnionExpression().getOpName(), "$setUnion");
			}

		},

		"#evaluateInternal()": {

			"Should fail if array1 is not an array": function testArg1() {
				var array1 = "not an array",
					array2 = [6, 7, 8, 9],
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setUnion", input, vps);
				assert.throws(function () {
					expr.evaluate({});
				});
			},

			"Should fail if array2 is not an array": function testArg2() {
				var array1 = [1, 2, 3, 4],
					array2 = "not an array",
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setUnion", input, vps);
				assert.throws(function () {
					expr.evaluate({});
				});
			},

			"Should fail if both are not an array": function testArg1andArg2() {
				var array1 = "not an array",
					array2 = "not an array",
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setUnion", input, vps);
				assert.throws(function () {
					expr.evaluate({});
				});
			},

			"Should pass and return [1, 2, 3, 4, 5, 8, 9]": function testBasicAssignment(){
				var array1 = [1, 2, 3, 9, 8],
					array2 = [1, 2, 3, 4, 5],
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setUnion", input, vps),
					result = expr.evaluate({}),
					expected = [1, 2, 3, 4, 5, 8, 9],
					msg = errMsg("$setUnion", input, expr.serialize(false), expected, result);
				assert.deepEqual(result, expected, msg);
			},

			"Should pass and return [1, 2, 3, 4, 5, 7]": function testBasicAssignment() {
				var array1 = [2, 4],
					array2 = [1, 2, 3, 4, 5],
					array3 = [7, 2, 1],
					array4 = [],
					input = [array1,array2,array3, array4],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setUnion", input, vps),
					result = expr.evaluate({}),
					expected = [1, 2, 3, 4, 5, 7],
					msg = errMsg("$setUnion", input, expr.serialize(false), expected, result);
				assert.deepEqual(result, expected, msg);
			},

			"Should pass and return [1, 2, 7]": function testBasicAssignment() {
				var array1 = [],
					array2 = [],
					array3 = [7, 2, 1],
					array4 = [],
					input = [array1,array2,array3, array4],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setUnion", input, vps),
					result = expr.evaluate({}),
					expected = [1, 2, 7],
					msg = errMsg("$setUnion", input, expr.serialize(false), expected, result);
				assert.deepEqual(result, expected, msg);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);