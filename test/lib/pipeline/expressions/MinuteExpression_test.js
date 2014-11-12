"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	MinuteExpression = require("../../../../lib/pipeline/expressions/MinuteExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

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
