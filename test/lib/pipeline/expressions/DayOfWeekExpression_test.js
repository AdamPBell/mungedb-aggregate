"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	DayOfWeekExpression = require("../../../../lib/pipeline/expressions/DayOfWeekExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

exports.DayOfWeekExpression = {

	"constructor()": {

		"should create instance": function() {
			assert(new DayOfWeekExpression() instanceof DayOfWeekExpression);
			assert(new DayOfWeekExpression() instanceof Expression);
		},

		"should error if given invalid args": function() {
			assert.throws(function() {
				new DayOfWeekExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $dayOfWeek": function() {
			assert.equal(new DayOfWeekExpression().getOpName(), "$dayOfWeek");
		},

	},

	"#evaluate()": {

		"should return day of week; 7 for 2014-11-01T19:31:53.819Z": function() {
			var operands = [new Date("2014-11-01T19:31:53.819Z")],
				expr = Expression.parseExpression("$dayOfWeek", operands);
			assert.strictEqual(expr.evaluate({}), 7);
		},

	},

};
