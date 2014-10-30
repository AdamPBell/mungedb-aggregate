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

		"#getFactory()": {

			"should return the constructor for this class": function factoryIsConstructor(){
				assert.strictEqual(new MinuteExpression().getFactory(), undefined);
			}

		},

		"#evaluateInternal()": {

			"should return minute; 47 for 2013-02-18 3:47 pm": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$minute:"$someDate"}).evaluateInternal({someDate:new Date("2013-02-18T15:47:00.000Z")}), 47);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
