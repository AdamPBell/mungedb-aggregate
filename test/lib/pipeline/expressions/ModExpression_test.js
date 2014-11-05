"use strict";
var assert = require("assert"),
	ModExpression = require("../../../../lib/pipeline/expressions/ModExpression"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.ModExpression = {

	"constructor()": {

		"should construct instance": function() {
			assert(new ModExpression() instanceof ModExpression);
			assert(new ModExpression() instanceof Expression);
		},

		"should error if given args": function() {
			assert.throws(function() {
				new ModExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $mod": function() {
			assert.equal(new ModExpression().getOpName(), "$mod");
		},

	},

	"#evaluate()": {

		"should return modulus of two numbers": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$mod: ["$a", "$b"]}, vps),
				input = {a: 6, b: 2};
			assert.strictEqual(expr.evaluate(input), 0);
		},

		"should return null if first is null": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$mod: ["$a", "$b"]}, vps),
				input = {a: null, b: 2};
			assert.strictEqual(expr.evaluate(input), null);
		},

		"should return null if first is undefined": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$mod: ["$a", "$b"]}, vps),
				input = {a: undefined, b: 2};
			assert.strictEqual(expr.evaluate(input), null);
		},

		"should return null if second is null": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$mod: ["$a", "$b"]}, vps),
				input = {a: 11, b: null};
			assert.strictEqual(expr.evaluate(input), null);
		},

		"should return null if second is undefined": function() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand({$mod: ["$a", "$b"]}, vps),
				input = {a: 42, b: undefined};
			assert.strictEqual(expr.evaluate(input), null);
		},

	},

};
