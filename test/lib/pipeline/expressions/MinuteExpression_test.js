"use strict";
var assert = require("assert"),
	MinuteExpression = require("../../../../lib/pipeline/expressions/MinuteExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.MinuteExpression = {

	"constructor()": {

		"should create instance": function() {
			assert(new MinuteExpression() instanceof MinuteExpression);
			assert(new MinuteExpression() instanceof Expression);
		},

		"should error if given invalid args": function() {
			assert.throws(function() {
				new MinuteExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $minute": function() {
			assert.equal(new MinuteExpression().getOpName(), "$minute");
		},

	},

	"#evaluate()": {

		"should return minute; 31 for 2014-11-01T19:31:53.819Z": function() {
			var operands = [new Date("2014-11-01T19:31:53.819Z")],
				expr = Expression.parseExpression("$minute", operands);
			assert.strictEqual(expr.evaluate({}), 31);
		},

	},

};
