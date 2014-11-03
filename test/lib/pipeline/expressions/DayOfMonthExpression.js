"use strict";
var assert = require("assert"),
	DayOfMonthExpression = require("../../../../lib/pipeline/expressions/DayOfMonthExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

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
