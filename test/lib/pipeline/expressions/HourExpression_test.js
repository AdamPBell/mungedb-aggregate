"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	HourExpression = require("../../../../lib/pipeline/expressions/HourExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

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
