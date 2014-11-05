"use strict";
var assert = require("assert"),
	DayOfWeekExpression = require("../../../../lib/pipeline/expressions/DayOfWeekExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

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
