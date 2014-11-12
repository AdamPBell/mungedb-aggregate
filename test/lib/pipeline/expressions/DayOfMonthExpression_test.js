"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	DayOfMonthExpression = require("../../../../lib/pipeline/expressions/DayOfMonthExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

exports.DayOfMonthExpression = {

	"constructor()": {

		"should create instance": function() {
			assert(new DayOfMonthExpression() instanceof DayOfMonthExpression);
			assert(new DayOfMonthExpression() instanceof Expression);
		},

		"should error if given invalid args": function() {
			assert.throws(function() {
				new DayOfMonthExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $dayOfMonth": function() {
			assert.equal(new DayOfMonthExpression().getOpName(), "$dayOfMonth");
		},

	},

	"#evaluate()": {

		"should return day of month; 10 for 2014-11-01T19:31:53.819Z": function() {
			var operands = [new Date("2014-11-01T19:31:53.819Z")],
				expr = Expression.parseExpression("$dayOfMonth", operands);
			assert.strictEqual(expr.evaluate({}), 1);
		},

	},

};
