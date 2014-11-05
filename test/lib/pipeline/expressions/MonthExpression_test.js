"use strict";
var assert = require("assert"),
	MonthExpression = require("../../../../lib/pipeline/expressions/MonthExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.MonthExpression = {

	"constructor()": {

		"should create instance": function() {
			assert(new MonthExpression() instanceof MonthExpression);
			assert(new MonthExpression() instanceof Expression);
		},

		"should error if given invalid args": function() {
			assert.throws(function() {
				new MonthExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $month": function() {
			assert.equal(new MonthExpression().getOpName(), "$month");
		},

	},

	"#evaluate()": {

		"should return month; 11 for 2014-11-01T19:31:53.819Z": function() {
			var operands = [new Date("2014-11-01T19:31:53.819Z")],
				expr = Expression.parseExpression("$month", operands);
			assert.strictEqual(expr.evaluate({}), 11);
		},

	},

};
