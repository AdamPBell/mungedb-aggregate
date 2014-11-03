"use strict";
var assert = require("assert"),
	NotExpression = require("../../../../lib/pipeline/expressions/NotExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

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
