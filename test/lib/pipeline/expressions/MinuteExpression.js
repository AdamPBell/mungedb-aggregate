"use strict";
var assert = require("assert"),
	MinuteExpression = require("../../../../lib/pipeline/expressions/MinuteExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"MinuteExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new MinuteExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $minute": function testOpName(){
				assert.equal(new MinuteExpression().getOpName(), "$minute");
			}

		},

		"#evaluateInternal()": {

			"should return minute; 47 for 2013-02-18 3:47 pm": function testStuff(){
				var input = [new Date("Mon Feb 18 2013 03:47:15 GMT-0500 (EST)")];
				assert.strictEqual(Expression.parseExpression("$minute", input).evaluate({}), 47);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
