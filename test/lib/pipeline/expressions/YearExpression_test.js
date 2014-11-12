"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	YearExpression = require("../../../../lib/pipeline/expressions/YearExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

exports.YearExpression = {

	"constructor()": {

		"should create instance": function() {
			assert(new YearExpression() instanceof YearExpression);
			assert(new YearExpression() instanceof Expression);
		},

		"should error if given invalid args": function() {
			assert.throws(function() {
				new YearExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $year": function() {
			assert.equal(new YearExpression().getOpName(), "$year");
		},

	},

	"#evaluate()": {

		"should return year; 2014 for 2014-11-01T19:31:53.819Z": function() {
			var operands = [new Date("2014-11-01T19:31:53.819Z")],
				expr = Expression.parseExpression("$year", operands);
			assert.strictEqual(expr.evaluate({}), 2014);
		},

	},

};
