"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	MillisecondExpression = require("../../../../lib/pipeline/expressions/MillisecondExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

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
