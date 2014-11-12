"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	DivideExpression = require("../../../../lib/pipeline/expressions/DivideExpression"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

exports.DivideExpression = {

	"constructor()": {

		"should construct instance": function() {
			assert(new DivideExpression() instanceof DivideExpression);
			assert(new DivideExpression() instanceof Expression);
		},

		"should error if given args": function() {
			assert.throws(function() {
				new DivideExpression("bad stuff");
			});
		}
	},

	"#getOpName()": {

		"should return the correct op name; $size": function() {
			assert.equal(new DivideExpression().getOpName(), "$divide");
		}

	},

	"#evaluate()": {

		"should divide two numbers": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$divide: ["$a", "$b"]}, vps),
				input = {a: 6, b: 2};
			assert.strictEqual(expr.evaluate(input), 3);
		}

	}

};
