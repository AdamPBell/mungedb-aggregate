"use strict";
var assert = require("assert"),
	MonthExpression = require("../../../../lib/pipeline/expressions/MonthExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"MonthExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new MonthExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $month": function testOpName(){
				assert.equal(new MonthExpression().getOpName(), "$month");
			}

		},

		"#evaluateInternal()": {

			"should return month; 2 for 2013-02-18": function testStuff(){
				var input = [new Date("Mon Feb 18 2013 00:00:00 GMT-0500 (EST)")];
				assert.strictEqual(Expression.parseExpression("$month", input).evaluate({}), 2);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
