"use strict";
var assert = require("assert"),
	YearExpression = require("../../../../lib/pipeline/expressions/YearExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"YearExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new YearExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $year": function testOpName(){
				assert.equal(new YearExpression().getOpName(), "$year");
			}

		},

		"#evaluateInternal()": {

			"should return year; 2013 for 2013-02-18": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$year:"$someDate"}).evaluate({someDate:new Date("Mon Feb 18 2013 00:00:00 GMT-0500 (EST)")}), 2013);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
