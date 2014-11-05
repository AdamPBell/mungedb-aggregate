"use strict";
var assert = require("assert"),
	WeekExpression = require("../../../../lib/pipeline/expressions/WeekExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

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
