"use strict";
var assert = require("assert"),
	DayOfWeekExpression = require("../../../../lib/pipeline/expressions/DayOfWeekExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"DayOfWeekExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new DayOfWeekExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $dayOfWeek": function testOpName(){
				assert.equal(new DayOfWeekExpression().getOpName(), "$dayOfWeek");
			}

		},

		"#evaluate()": {

			"should return day of week; 2 for 2013-02-18": function testStuff(){
				var input = [new Date("2013-02-18T00:00:00.000Z")];
				assert.strictEqual(Expression.parseExpression("$dayOfWeek", input).evaluate({}), 2);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
