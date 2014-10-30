"use strict";
var assert = require("assert"),
		DayOfMonthExpression = require("../../../../lib/pipeline/expressions/DayOfMonthExpression"),
		Expression = require("../../../../lib/pipeline/expressions/Expression"),
		VariablesParseState = require("../../../../Lib/pipeline/expressions/VariablesParseState"),
		VariablesIdGenerator = require("../../../../Lib/pipeline/expressions/VariablesIdGenerator");


module.exports = {

		"DayOfMonthExpression": {

				"constructor()": {

						"should throw Error when constructing without args": function testConstructor() {
								assert.throws(function() {
										new DayOfMonthExpression();
								});
						},

						"should not throw Error when constructing with an arg": function testConstructor() {
								assert.doesNotThrow(function() {
										new DayOfMonthExpression("1/1/2014");
								});
						}

				},

				"#getOpName()": {

						"should return the correct op name; $dayOfMonth": function testOpName() {
								assert.equal(new DayOfMonthExpression("1/1/2014").getOpName(), "$dayOfMonth");
						}

				},

				"#evaulateInternal1()": {

						"should return day of month; 10 for 2013-03-10": function testOpName() {
								assert.equal(new DayOfMonthExpression("2013-03-10T00:00:00.000Z").evaluateInternal(), "10");
						}

				},

				"#evaluateInternal2()": {

						"should return day of month; 18 for 2013-02-18": function testStuff() {

								var idGenerator = new VariablesIdGenerator();
								var vps = new VariablesParseState(idGenerator);
								var parseOp = Expression.parseOperand({
										$dayOfMonth: "$someDate"
								}, vps);

								var result = parseOp.evaluateInternal({
										$someDate: new Date("2013-02-18T00:00:00.000Z")
								});

								assert.strictEqual(result, "2");

										// assert.strictEqual(Expression.parseOperand({
										// $dayOfMonth: "$someDate"
										// }, vps).evaluate({
										// someDate: new Date("2013-02-18T00:00:00.000Z")
										// }), 18);
								}

						}

				}

		};

		if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);