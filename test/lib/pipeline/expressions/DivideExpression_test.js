"use strict";
var assert = require("assert"),
	DivideExpression = require("../../../../lib/pipeline/expressions/DivideExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

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
		},

	},

	"#getOpName()": {

		"should return the correct op name; $size": function() {
			assert.equal(new DivideExpression().getOpName(), "$divide");
		},

	},

	"#evaluate()": {

		"should return the size": function() {
			var spec = {$divide: ["$a", "$b"]},
				vars = {a: 6, b: 2},
				expected = 3;
			assert.strictEqual(Expression.parseOperand(spec).evaluate(vars), expected);
		},

	},

};
