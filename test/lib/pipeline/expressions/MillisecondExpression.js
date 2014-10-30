"use strict";
var assert = require("assert"),
		MillisecondExpression = require("../../../../lib/pipeline/expressions/MillisecondExpression"),
		Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

		"MillisecondExpression": {

				"constructor()": {

						"should not throw Error when constructing without args": function testConstructor() {
								assert.doesNotThrow(function() {
										new MillisecondExpression();
								});
						}

				},

				"#getOpName()": {

						"should return the correct op name; $millisecond": function testOpName() {
								assert.equal(new MillisecondExpression().getOpName(), "$millisecond");
						}

				},

				"#getFactory()": {

						"should return the constructor for this class": function factoryIsConstructor() {
								assert.strictEqual(new MillisecondExpression().getFactory(), undefined);
						}

				},

				"#evaluate()": {

						"should return the current millisecond in the date; 19 for 2013-02-18 11:24:19 EST": function testStuff() {
								assert.strictEqual(Expression.parseOperand({
										$millisecond: "$someDate"
								}).evaluate({
										someDate: new Date("2013-02-18T11:24:19.456Z")
								}), 456);
						}

						/*
			"should return the leap millisecond in the date; 60 for June 30, 2012 at 23:59:60 UTC": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$millisecond:"$someDate"}).evaluate({someDate:new Date("June 30, 2012 at 23:59:60 UTC")}), 60);
			}

				*/
				}

		}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);