"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
		SubtractExpression = require("../../../../lib/pipeline/expressions/SubtractExpression"),
		Expression = require("../../../../lib/pipeline/expressions/Expression"),
		VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
		VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState");

exports.SubtractExpression = {

	"constructor()": {

		"should not throw Error when constructing without args": function() {
			assert.doesNotThrow(function() {
				new SubtractExpression();
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $subtract": function() {
			assert.equal(new SubtractExpression().getOpName(), "$subtract");
		},

	},

	"#evaluateInternal()": {

		"should return the result of subtraction between two numbers": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
				result = expr.evaluate({a:2, b:1}),
				expected = 1;
			assert.strictEqual(result, expected);
		},

		"should return null if left is null": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
				result = expr.evaluate({a:null, b:1}),
				expected = null;
			assert.strictEqual(result, expected);
		},

		"should return null if left is undefined": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
				result = expr.evaluate({a:undefined, b:1}),
				expected = null;
			assert.strictEqual(result, expected);
		},

		"should return null if right is null": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
				result = expr.evaluate({a:2, b:null}),
				expected = null;
			assert.strictEqual(result, expected);
		},

		"should return null if right is undefined": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
				result = expr.evaluate({a:2, b:undefined}),
				expected = null;
			assert.strictEqual(result, expected);
		},

		"should subtract 2 dates": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
				date2 = new Date("Jan 3 1990"),
				date1 = new Date("Jan 1 1990"),
				result = expr.evaluate({a:date2, b:date1}),
				expected = date2 - date1;
			assert.strictEqual(result, expected);
		},

		"should subtract a number of millis from a date": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
				date2 = new Date("Jan 3 1990"),
				millis = 24 * 60 * 60 * 1000,
				result = expr.evaluate({a:date2, b:millis}),
				expected = date2 - millis;
			assert.strictEqual(
				JSON.stringify(result),
				JSON.stringify(expected)
			);
		},

		"should throw if left is not a date or number": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
				date2 = {},
				date1 = new Date();
			assert.throws(function() {
				expr.evaluate({a:date2, b:date1});
			});
		},

		"should throw if right is not a date or number": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
				date2 = new Date(),
				date1 = {};
			assert.throws(function() {
				expr.evaluate({a:date2, b:date1});
			});
		},

	},

};
