"use strict";
var assert = require("assert"),
	SecondExpression = require("../../../../lib/pipeline/expressions/SecondExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"SecondExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new SecondExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $second": function testOpName(){
				assert.equal(new SecondExpression().getOpName(), "$second");
			}

		},

		"#getFactory()": {

			"should return the constructor for this class": function factoryIsConstructor(){
				assert.strictEqual(new SecondExpression().getFactory(), undefined);
			}

		},

		"#evaluate()": {

			"should return the current second in the date; 19 for 2013-02-18 11:24:19 EST": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$second:"$someDate"}).evaluate({someDate:new Date("2013-02-18T11:24:19.000Z")}), 19);
			}

				/*
			"should return the leap second in the date; 60 for June 30, 2012 at 23:59:60 UTC": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$second:"$someDate"}).evaluate({someDate:new Date("June 30, 2012 at 23:59:60 UTC")}), 60);
			}

				*/
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
