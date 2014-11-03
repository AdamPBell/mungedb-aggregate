"use strict";
var assert = require("assert"),
	MillisecondExpression = require("../../../../lib/pipeline/expressions/MillisecondExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.MillisecondExpression = {

	"constructor()": {

		"should create instance": function() {
			assert(new MillisecondExpression() instanceof MillisecondExpression);
			assert(new MillisecondExpression() instanceof Expression);
		},

		"should error if given invalid args": function() {
			assert.throws(function() {
				new MillisecondExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $millisecond": function() {
			assert.equal(new MillisecondExpression().getOpName(), "$millisecond");
		},

	},

	"#evaluate()": {

		"should return millisecond; 819 for 2014-11-01T19:31:53.819Z": function() {
			var operands = [new Date("2014-11-01T19:31:53.819Z")],
				expr = Expression.parseExpression("$millisecond", operands);
			assert.strictEqual(expr.evaluate({}), 819);
		},

	},

};
