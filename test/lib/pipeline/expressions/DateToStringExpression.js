"use strict";
var assert = require("assert"),
	DateToStringExpression = require("../../../../lib/pipeline/expressions/DateToStringExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");
	//VariablesParseState = require("../../../../Lib/pipeline/expressions/VariablesParseState"),
	//VariablesIdGenerator = require("../../../../Lib/pipeline/expressions/VariablesIdGenerator");

module.exports = {

	"DateToStringExpression": {

		"constructor()": {

			"should not throw Error when constructing with 2 args": function testConstructor() {
					assert.doesNotThrow(function() {
							new DateToStringExpression("%Y%m%d", "1/1/2014");
					});
			}
		},

		"#getOpName()" : {

			"should return the correct opName: $dateToString": function testOpName() {
				assert.equal(new DateToStringExpression("%Y%m%d", "1/1/2014").getOpName(), "$dateToString");
			}
		},

		"evaluateInternal1()" : {
			"should return the date to string": function evaluateInternal1() {
				var input = [new Date("Mon Feb 18 2013 00:00:00 GMT-0500 (EST)")];  //"%Y%m%d", 
				assert.strictEqual(Expression.parseExpression("$dateToString", input).evaluate({}), "2013/2/18");
			}
		}
	}
}

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);