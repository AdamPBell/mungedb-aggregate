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
				var array1 = [1, 2, 3, 5, 4],
					array2 = [1, 3, 2, 4, 5],
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setEquals", input, vps),
					result = expr.evaluate({}),
					expected = true,
					msg = errMsg("$setEquals", input, expr.serialize(false), expected, result);
				assert.equal(result, expected, msg);
			},

			"Should pass and array1 should not equal array2": function testBasicAssignment(){
				var array1 = [1, 2, 3, 4],
					array2 = [1, 3, 2, 4, 5],
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setEquals", input, vps),
					result = expr.evaluate({}),
					expected = false,
					msg = errMsg("$setEquals", input, expr.serialize(false), expected, result);
				assert.equal(result, expected, msg);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);