"use strict";
var assert = require("assert"),
	FirstAccumulator = require("../../../../lib/pipeline/accumulators/FirstAccumulator");

function createAccumulator(){
	return new FirstAccumulator();
}

module.exports = {

	"FirstAccumulator": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new FirstAccumulator();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $first": function testOpName(){
				assert.equal(new FirstAccumulator().getOpName(), "$first");
			}

		},

		"#getFactory()": {

			"should return the constructor for this class": function factoryIsConstructor(){
				assert.strictEqual(new FirstAccumulator().getFactory(), FirstAccumulator);
			}

		},

		"#processInternal()": {

			"The accumulator has no value": function none() {
				// The accumulator returns no value in this case.
				var acc = createAccumulator();
				assert.ok(!acc.getValue());
			},

			"The accumulator uses processInternal on one input and retains its value": function one() {
				var acc = createAccumulator();
				acc.processInternal(5);
				assert.strictEqual(acc.getValue(), 5);
			},

			"The accumulator uses processInternal on one input with the field missing and retains undefined": function missing() {
				var acc = createAccumulator();
				acc.processInternal();
				assert.strictEqual(acc.getValue(), undefined);
			},

			"The accumulator uses processInternal on two inputs and retains the value in the first": function two() {
				var acc = createAccumulator();
				acc.processInternal(5);
				acc.processInternal(7);
				assert.strictEqual(acc.getValue(), 5);
			},

			"The accumulator uses processInternal on two inputs and retains the undefined value in the first": function firstMissing() {
				var acc = createAccumulator();
				acc.processInternal();
				acc.processInternal(7);
				assert.strictEqual(acc.getValue(), undefined);
			}
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
