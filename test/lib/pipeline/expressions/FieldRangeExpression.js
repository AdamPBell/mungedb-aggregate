"use strict";
var assert = require("assert"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	FieldRangeExpression = require("../../../../lib/pipeline/expressions/FieldRangeExpression");


module.exports = {

	"FieldRangeExpression": {

		"constructor()": {

			"should throw Error if no args": function testInvalid(){
				assert.throws(function() {
					new FieldRangeExpression();
				});
			}

		},

		"#evaluate()": {


			"$eq": {

				"should return false if documentValue < rangeValue": function testEqLt() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$eq", 1).evaluate({a:0}), false);
				},

				"should return true if documentValue == rangeValue": function testEqEq() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$eq", 1).evaluate({a:1}), true);
				},

				"should return false if documentValue > rangeValue": function testEqGt() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$eq", 1).evaluate({a:2}), false);
				}

			},

			"$lt": {

				"should return true if documentValue < rangeValue": function testLtLt() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$lt", "y").evaluate({a:"x"}), true);
				},

				"should return false if documentValue == rangeValue": function testLtEq() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$lt", "y").evaluate({a:"y"}), false);
				},

				"should return false if documentValue > rangeValue": function testLtGt() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$lt", "y").evaluate({a:"z"}), false);
				}

			},

			"$lte": {

				"should return true if documentValue < rangeValue": function testLtLt() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$lte", 1.1).evaluate({a:1.0}), true);
				},

				"should return true if documentValue == rangeValue": function testLtEq() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$lte", 1.1).evaluate({a:1.1}), true);
				},

				"should return false if documentValue > rangeValue": function testLtGt() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$lte", 1.1).evaluate({a:1.2}), false);
				}

			},

			"$gt": {

				"should return false if documentValue < rangeValue": function testLtLt() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$gt", 100).evaluate({a:50}), false);
				},

				"should return false if documentValue == rangeValue": function testLtEq() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$gt", 100).evaluate({a:100}), false);
				},

				"should return true if documentValue > rangeValue": function testLtGt() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$gt", 100).evaluate({a:150}), true);
				}

			},

			"$gte": {

				"should return false if documentValue < rangeValue": function testLtLt() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$gte", "abc").evaluate({a:"a"}), false);
				},

				"should return true if documentValue == rangeValue": function testLtEq() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$gte", "abc").evaluate({a:"abc"}), true);
				},

				"should return true if documentValue > rangeValue": function testLtGt() {
					assert.strictEqual(new FieldRangeExpression(new FieldPathExpression("a"), "$gte", "abc").evaluate({a:"abcd"}), true);
				}

			},

			"should throw Error if given multikey values": function testMultikey(){
				assert.throws(function(){
					new FieldRangeExpression(new FieldPathExpression("a"), "$eq", 0).evaluate({a:[1,0,2]});
				});
			}

		},

//		"#optimize()": {
//			"should optimize if ...": function testOptimize(){
//			},
//			"should not optimize if ...": function testNoOptimize(){
//			}
//		},

		"#addDependencies()": {

			"should return the range's path as a dependency": function testDependencies(){
				var deps = new FieldRangeExpression(new FieldPathExpression("a.b.c"), "$eq", 0).addDependencies({});
				assert.strictEqual(Object.keys(deps).length, 1);
				assert.ok(deps['a.b.c']);
			}

		},

//		"#intersect()": {
//		},

//		"#toJSON()": {
//		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
