"use strict";
var assert = require("assert"),
		VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
		VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
		SetIsSubsetExpression = require("../../../../lib/pipeline/expressions/SetIsSubsetExpression"),
		Expression = require("../../../../lib/pipeline/expressions/Expression");


function errMsg(expr, args, tree, expected, result) {
	return 	"for expression " + expr +
			" with argument " + args +
			" full tree: " + JSON.stringify(tree) +
			" expected: " + expected +
			" result: " + result;
}

module.exports = {

	"SetIsSubsetExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor() {
				assert.doesNotThrow(function() {
					new SetIsSubsetExpression();
				});
			},

			"should throw Error when constructing with args": function testConstructor() {
				assert.throws(function() {
					new SetIsSubsetExpression("someArg");
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $setIsSubset": function testOpName() {
				assert.equal(new SetIsSubsetExpression().getOpName(), "$setIsSubset");
			}

		},

		"#evaluateInternal()": {

			beforeEach: function() {
				this.compare = function(array1, array2, expected) {
					var input = [array1, array2],
						idGenerator = new VariablesIdGenerator(),
						vps = new VariablesParseState(idGenerator),
						expr = Expression.parseExpression("$setIsSubset", input, vps),
						result = expr.evaluate({}),
						msg = errMsg("$setIsSubset", input, expr.serialize(false), expected, result);
					assert.equal(result, expected, msg);
				}
			},

			"Should fail if array1 is not an array": function testArg1() {
				var array1 = "not an array",
					array2 = [6, 7, 8, 9],
					input = [array1,array2],
					idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					expr = Expression.parseExpression("$setIsSubset", input, vps);
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
					expr = Expression.parseExpression("$setIsSubset", input, vps);
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
					expr = Expression.parseExpression("$setIsSubset", input, vps);
				assert.throws(function () {
					expr.evaluate({});
				});
			},

			"Should pass and return a true": function(){
				this.compare([2, 3], [1, 2, 3, 4, 5], true);
			},

			"Should pass and return false": function() {
				this.compare([1, 2, 3, 4, 5], [7, 8, 9], false);
			},

			"Should return false when the 1st array is not empty and the 2nd array is": function() {
				this.compare([1, 2, 3, 4, 5], [], false);
			},

			"Should return true if an 1st array is empty and the 2nd is not": function () {
				this.compare([],[1, 2, 3, 4, 5], true);
			},

			"Should return true if both are empty": function () {
				this.compare([],[],true);
			},

			"should not consider a non-nested source array the same as a nested object array": function() {
				this.compare([1], [[1]], false);
			},

			"should not consider a nested source the same as an unnested object array": function(){
				this.compare([[1]], [1], false);
			},

			"should ignore dups in the source": function(){
				this.compare([1,2,1], [1,2], true);
			},

			"should know the difference between a number and a string": function(){
				this.compare([1], ["1"], true);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);