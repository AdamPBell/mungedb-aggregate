"use strict";
var assert = require("assert"),
	AvgAccumulator = require("../../../../lib/pipeline/accumulators/AvgAccumulator");

function createAccumulator(){
	return new AvgAccumulator();
}

module.exports = {

	"AvgAccumulator": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new AvgAccumulator();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $avg": function testOpName(){
				assert.strictEqual(new AvgAccumulator().getOpName(), "$avg");
			}

		},

		"#processInternal()": {

			"should evaluate no documents": function testStuff(){
				var avgAccumulator = createAccumulator();
				assert.strictEqual(avgAccumulator.getValue(), 0);
			},

			"should evaluate one document with a field that is NaN": function testStuff(){
				var avgAccumulator = createAccumulator();
				avgAccumulator.processInternal(Number("foo"));
				// NaN is unequal to itself
				assert.notStrictEqual(avgAccumulator.getValue(), avgAccumulator.getValue());
			},


			"should evaluate one document and avg it's value": function testStuff(){
				var avgAccumulator = createAccumulator();
				avgAccumulator.processInternal(5);
				assert.strictEqual(avgAccumulator.getValue(), 5);

			},


			"should evaluate and avg two ints": function testStuff(){
				var avgAccumulator = createAccumulator();
				avgAccumulator.processInternal(5);
				avgAccumulator.processInternal(7);
				assert.strictEqual(avgAccumulator.getValue(), 6);
			},

			"should evaluate and avg two ints overflow": function testStuff(){
				var avgAccumulator = createAccumulator();
				avgAccumulator.processInternal(Number.MAX_VALUE);
				avgAccumulator.processInternal(Number.MAX_VALUE);
				assert.strictEqual(Number.isFinite(avgAccumulator.getValue()), false);
			},


			"should evaluate and avg two negative ints": function testStuff(){
				var avgAccumulator = createAccumulator();
				avgAccumulator.processInternal(-5);
				avgAccumulator.processInternal(-7);
				assert.strictEqual(avgAccumulator.getValue(), -6);
			},

//TODO Not sure how to do this in Javascript
//			"should evaluate and avg two negative ints overflow": function testStuff(){
//				var avgAccumulator = createAccumulator();
//				avgAccumulator.processInternal(Number.MIN_VALUE);
//				avgAccumulator.processInternal(7);
//				assert.strictEqual(avgAccumulator.getValue(), Number.MAX_VALUE);
//			},
//

			"should evaluate and avg int and float": function testStuff(){
				var avgAccumulator = createAccumulator();
				avgAccumulator.processInternal(8.5);
				avgAccumulator.processInternal(7);
				assert.strictEqual(avgAccumulator.getValue(), 7.75);
			},

			"should evaluate and avg one Number and a NaN sum to NaN": function testStuff(){
				var avgAccumulator = createAccumulator();
				avgAccumulator.processInternal(8);
				avgAccumulator.processInternal(Number("bar"));
				// NaN is unequal to itself
				assert.notStrictEqual(avgAccumulator.getValue(), avgAccumulator.getValue());
			},

			"should evaluate and avg a null value to 0": function testStuff(){
				var avgAccumulator = createAccumulator();
				avgAccumulator.processInternal(null);
				assert.strictEqual(avgAccumulator.getValue(), 0);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
