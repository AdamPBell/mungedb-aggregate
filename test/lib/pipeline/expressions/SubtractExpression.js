"use strict";
var assert = require("assert"),
		SubtractExpression = require("../../../../lib/pipeline/expressions/SubtractExpression"),
		Expression = require("../../../../lib/pipeline/expressions/Expression"),
		VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
		VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState");


module.exports = {

		"SubtractExpression": {

				"constructor()": {

						"should not throw Error when constructing without args": function testConstructor() {
								assert.doesNotThrow(function() {
										new SubtractExpression();
								});
						}

				},

				"#getOpName()": {

						"should return the correct op name; $subtract": function testOpName() {
								assert.equal(new SubtractExpression().getOpName(), "$subtract");
						}

				},

				"#evaluateInternal()": {

						"should return the result of subtraction between two numbers": function testStuff() {
							var idGenerator = new VariablesIdGenerator(),
								vps = new VariablesParseState(idGenerator),
								expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
								result = expr.evaluate({a:2, b:1}),
								expected = 1;
							assert.equal(result, expected);
						},

						"should return null if left is null": function testStuff() {
							var idGenerator = new VariablesIdGenerator(),
								vps = new VariablesParseState(idGenerator),
								expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
								result = expr.evaluate({a:null, b:1}),
								expected = null;
							assert.equal(result, expected);
						},

						"should return null if left is undefined": function testStuff() {
							var idGenerator = new VariablesIdGenerator(),
								vps = new VariablesParseState(idGenerator),
								expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
								result = expr.evaluate({a:undefined, b:1}),
								expected = null;
							assert.equal(result, expected);
						},

						"should return null if right is null": function testStuff() {
							var idGenerator = new VariablesIdGenerator(),
								vps = new VariablesParseState(idGenerator),
								expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
								result = expr.evaluate({a:2, b:null}),
								expected = null;
							assert.equal(result, expected);
						},

						"should return null if right is undefined": function testStuff() {
							var idGenerator = new VariablesIdGenerator(),
								vps = new VariablesParseState(idGenerator),
								expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
								result = expr.evaluate({a:2, b:undefined}),
								expected = null;
							assert.equal(result, expected);
						},

						"should subtract 2 dates": function testStuff() {
							var idGenerator = new VariablesIdGenerator(),
								vps = new VariablesParseState(idGenerator),
								expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
								date2 = new Date("Jan 3 1990"),
								date1 = new Date("Jan 1 1990"),
								result = expr.evaluate({a:date2, b:date1}),
								expected = date2 - date1;
							assert.equal(result, expected);
						},

						"should subtract a number of millis from a date": function testStuff() {
							var idGenerator = new VariablesIdGenerator(),
								vps = new VariablesParseState(idGenerator),
								expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
								date2 = new Date("Jan 3 1990"),
								millis = 24 * 60 * 60 * 1000,
								result = expr.evaluate({a:date2, b:millis}),
								expected = new Date(date2 - millis);
							assert.strictEqual(
								JSON.stringify(result),
								JSON.stringify(expected)
							);
						},

						"should throw if left is not a date or number": function testStuff() {
							var idGenerator = new VariablesIdGenerator(),
								vps = new VariablesParseState(idGenerator),
								expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
								date2 = {},
								date1 = new Date();
							assert.throws(function() {
								expr.evaluate({a:date2, b:date1});
							});
						},

						"should throw if right is not a date or number": function testStuff() {
							var idGenerator = new VariablesIdGenerator(),
								vps = new VariablesParseState(idGenerator),
								expr = Expression.parseOperand({$subtract:["$a", "$b"]}, vps),
								date2 = new Date(),
								date1 = {};
							assert.throws(function() {
								expr.evaluate({a:date2, b:date1});
							});
						}
				}

		}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);