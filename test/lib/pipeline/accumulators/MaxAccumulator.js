"use strict";
var assert = require("assert"),
	MaxAccumulator = require("../../../../lib/pipeline/accumulators/MinMaxAccumulator");

function createAccumulator(){
	return MaxAccumulator.createMax();
}


module.exports = {

	"MaxAccumulator": {

		"constructor()": {

			"should not throw Error when constructing without args using createMax": function testConstructor(){
				assert.doesNotThrow(function(){
					MaxAccumulator.createMax();
				});
			},

			"should throw Error when constructing without args using default constructor": function testConstructor(){
				assert.throws(function(){
					new MaxAccumulator();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $max": function testOpName(){
				var acc = createAccumulator();
				assert.equal(acc.getOpName(), "$max");
			}

		},

		"#processInternal()": {

			"The accumulator evaluates no documents": function none() {
				// The accumulator returns no value in this case.
				var acc = createAccumulator();
				assert.ok(!acc.getValue());
			},

			"The accumulator evaluates one document and retains its value": function one() {
				var acc = createAccumulator();
				acc.processInternal(5);
				assert.strictEqual(acc.getValue(), 5);
			},

			"The accumulator evaluates one document with the field missing retains undefined": function missing() {
				var acc = createAccumulator();
				acc.processInternal();
				assert.strictEqual(acc.getValue(), undefined);
			},

			"The accumulator evaluates two documents and retains the maximum": function two() {
				var acc = createAccumulator();
				acc.processInternal(5);
				acc.processInternal(7);
				assert.strictEqual(acc.getValue(), 7);
			},

			"The accumulator evaluates two documents and retains the defined value in the first": function lastMissing() {
				var acc = createAccumulator();
				acc.processInternal(7);
				acc.processInternal();
				assert.strictEqual(acc.getValue(), 7);
			}
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
