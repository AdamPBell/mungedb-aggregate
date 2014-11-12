"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	SizeExpression = require("../../../../lib/pipeline/expressions/SizeExpression"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

exports.SizeExpression = {

	"constructor()": {

		"should construct instance": function testConstructor() {
			assert(new SizeExpression() instanceof SizeExpression);
			assert(new SizeExpression() instanceof Expression);
		},

		"should error if given args": function testConstructor() {
			assert.throws(function() {
				new SizeExpression("bad stuff");
			});
		}

	},

	"#evaluate()": {

		"should return the size": function testSize() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$size: ["$a"]}, vps),
				input = {
					a: [{a:1},{b:2}],
					b: [{c:3}]
				};
			assert.strictEqual(expr.evaluate(input), 2);
		}

	},

	"#getOpName()": {

		"should return the correct op name; $size": function testOpName() {
			assert.equal(new SizeExpression().getOpName(), "$size");
		}

	}

};
