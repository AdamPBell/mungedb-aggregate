"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	DayOfYearExpression = require("../../../../lib/pipeline/expressions/DayOfYearExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

exports.DayOfYearExpression = {

	"constructor()": {

		"should create instance": function() {
			assert(new DayOfYearExpression() instanceof DayOfYearExpression);
			assert(new DayOfYearExpression() instanceof Expression);
		},

		"should error if given invalid args": function() {
			assert.throws(function() {
				new DayOfYearExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $dayOfYear": function() {
			assert.equal(new DayOfYearExpression().getOpName(), "$dayOfYear");
		},

	},

	"#evaluate()": {

		"should return day of year; 305 for 2014-11-01T19:31:53.819Z": function() {
			var operands = [new Date("2014-11-01T19:31:53.819Z")],
				expr = Expression.parseExpression("$dayOfYear", operands);
			assert.strictEqual(expr.evaluate({}), 305);
		},

	},

};
