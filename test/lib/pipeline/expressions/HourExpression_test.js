"use strict";
var assert = require("assert"),
	HourExpression = require("../../../../lib/pipeline/expressions/HourExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.HourExpression = {

	"constructor()": {

		"should create instance": function() {
			assert(new HourExpression() instanceof HourExpression);
			assert(new HourExpression() instanceof Expression);
		},

		"should error if given invalid args": function() {
			assert.throws(function() {
				new HourExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $hour": function() {
			assert.equal(new HourExpression().getOpName(), "$hour");
		},

	},

	"#evaluate()": {

		"should return hour; 19 for 2014-11-01T19:31:53.819Z": function() {
			var operands = [new Date("2014-11-01T19:31:53.819Z")],
				expr = Expression.parseExpression("$hour", operands);
			assert.strictEqual(expr.evaluate({}), 19);
		},

	},

};
