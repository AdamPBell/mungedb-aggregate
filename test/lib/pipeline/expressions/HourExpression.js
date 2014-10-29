"use strict";
var assert = require("assert"),
	HourExpression = require("../../../../lib/pipeline/expressions/HourExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"HourExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new HourExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $hour": function testOpName(){
				assert.equal(new HourExpression().getOpName(), "$hour");
			}

		},

		"#evaluate()": {

			"should return hour; 15 for 2013-02-18 3:00pm": function testStuff(){
				var input = [new Date("2013-02-18T15:00:00.000Z")];
				assert.strictEqual(Expression.parseExpression("$hour", input).evaluate({}), 15);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
