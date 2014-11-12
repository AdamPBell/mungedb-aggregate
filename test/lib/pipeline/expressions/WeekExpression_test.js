"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	WeekExpression = require("../../../../lib/pipeline/expressions/WeekExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

exports.WeekExpression = {

	"constructor()": {

		"should create instance": function() {
			assert(new WeekExpression() instanceof WeekExpression);
			assert(new WeekExpression() instanceof Expression);
		},

		"should error if given invalid args": function() {
			assert.throws(function() {
				new WeekExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $week": function() {
			assert.equal(new WeekExpression().getOpName(), "$week");
		},

	},

	"#evaluate()": {

		"should return week; 7 for 2014-11-01T19:31:53.819Z": function() {
			var operands = [new Date("2014-11-01T19:31:53.819Z")],
				expr = Expression.parseExpression("$week", operands);
			assert.strictEqual(expr.evaluate({}), 43);
		},

	},

};
