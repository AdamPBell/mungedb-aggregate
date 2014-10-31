"use strict";
var assert = require("assert"),
	LetExpression = require("../../../../lib/pipeline/expressions/LetExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"LetExpression": {

		"constructor()": {

			"should throw an Error when constructing without args": function () {
				assert.throws(function () {
					new LetExpression();
				});
			},
			"should throw Error when constructing with one arg": function () {
				assert.throws(function () {
					new LetExpression(1);
				});
			},
			"should not throw when constructing with two args": function () {
				assert.doesNotThrow(function () {
					new LetExpression(1, 2);
				});
			}
		}
	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
