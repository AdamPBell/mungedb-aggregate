"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	NotExpression = require("../../../../lib/pipeline/expressions/NotExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

exports.NotExpression = {

	"constructor()": {

		"should not throw Error when constructing without args": function() {
			assert.doesNotThrow(function(){
				new NotExpression();
			});
		},

		"should throw when constructing with args": function() {
			assert.throws(function(){
				new NotExpression(1);
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $not": function() {
			assert.equal(new NotExpression().getOpName(), "$not");
		},

	},

	"#evaluate()": {

		"should return false for a true input; false for true": function() {
			assert.strictEqual(Expression.parseOperand({$not:true}, {}).evaluateInternal({}), false);
		},

		"should return true for a false input; true for false": function() {
			assert.strictEqual(Expression.parseOperand({$not:false}, {}).evaluateInternal({}), true);
		},

	},

};
