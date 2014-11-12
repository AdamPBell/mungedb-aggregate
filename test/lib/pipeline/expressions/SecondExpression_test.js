"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	SecondExpression = require("../../../../lib/pipeline/expressions/SecondExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

exports.SecondExpression = {

	"constructor()": {

		"should create instance": function() {
			assert(new SecondExpression() instanceof SecondExpression);
			assert(new SecondExpression() instanceof Expression);
		},

		"should error if given invalid args": function() {
			assert.throws(function() {
				new SecondExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $second": function() {
			assert.equal(new SecondExpression().getOpName(), "$second");
		},

	},

	"#evaluate()": {

		"should return second; 53 for 2014-11-01T19:31:53.819Z": function() {
			var operands = [new Date("2014-11-01T19:31:53.819Z")],
				expr = Expression.parseExpression("$second", operands);
			assert.strictEqual(expr.evaluate({}), 53);
		},

	},

};
