"use strict";
var assert = require("assert"),
	IfNullExpression = require("../../../../lib/pipeline/expressions/IfNullExpression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	Variables = require("../../../../lib/pipeline/expressions/Variables"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"IfNullExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function() {
				assert.doesNotThrow(function () {
					new IfNullExpression();
				});
			},
			"should throw Error when constructing with args": function () {
				assert.throws(function () {
					new IfNullExpression(1);
				});
			}
		},

		"#getOpName()": {

			"should return the correct op name; $ifNull": function() {
				assert.equal(new IfNullExpression().getOpName(), "$ifNull");
			}

		},

		"#evaluateInternal()": {
			beforeEach: function () {
				this.vps = new VariablesParseState(new VariablesIdGenerator());
				this.parsed = Expression.parseExpression("$ifNull", ["$a", "$b"], this.vps);
			},

			"should return the left hand side if the left hand side is not null or undefined": function() {
				assert.strictEqual(this.parsed.evaluate({a: 1, b: 2}), 1);
			},
			"should return the right hand side if the left hand side is null": function() {
				assert.strictEqual(this.parsed.evaluate({a: null, b: 2}), 2);
			},
			"should return the right hand side if the left hand side is undefined": function() {
				assert.strictEqual(this.parsed.evaluate({b: 2}), 2);
			}
		}
	}
};

if (!module.parent)(new (require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);