"use strict";
var assert = require("assert"),
	WeekExpression = require("../../../../lib/pipeline/expressions/WeekExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"WeekExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new WeekExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $week": function testOpName(){
				assert.equal(new WeekExpression().getOpName(), "$week");
			}

		},

		"#evaluate()": {

			"should return week; 7 for 2013-02-18 (zero-based index of next Sunday's week, per mongo 2.6.5)": function testStuff(){
				var input = [new Date("Mon Feb 18 2013 00:00:00 GMT-0500 (EST)")];
				assert.strictEqual(Expression.parseExpression("$week", input).evaluate({}), 7);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
