"use strict";
var assert = require("assert"),
	PushAccumulator = require("../../../../lib/pipeline/accumulators/PushAccumulator");


function createAccumulator(){
	return new PushAccumulator();
}

module.exports = {

	"PushAccumulator": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new PushAccumulator();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $push": function testOpName(){
				assert.strictEqual(new PushAccumulator().getOpName(), "$push");
			}

		},

		"#getFactory()": {

			"should return the constructor for this class": function factoryIsConstructor(){
				assert.strictEqual(new PushAccumulator().getFactory(), PushAccumulator);
			}

		},

		"#processInternal()": {

			"should processInternal no documents and return []": function testprocessInternal_None(){
				var accumulator = createAccumulator();
				assert.deepEqual(accumulator.getValue(), []);
			},

			"should processInternal a 1 and return [1]": function testprocessInternal_One(){
				var accumulator = createAccumulator();
				accumulator.processInternal(1);
				assert.deepEqual(accumulator.getValue(), [1]);
			},

			"should processInternal a 1 and a 2 and return [1,2]": function testprocessInternal_OneTwo(){
				var accumulator = createAccumulator();
				accumulator.processInternal(1);
				accumulator.processInternal(2);
				assert.deepEqual(accumulator.getValue(), [1,2]);
			},

			"should processInternal a 1 and a null and return [1,null]": function testprocessInternal_OneNull(){
				var accumulator = createAccumulator();
				accumulator.processInternal(1);
				accumulator.processInternal(null);
				assert.deepEqual(accumulator.getValue(), [1, null]);
			},

			"should processInternal a 1 and an undefined and return [1]": function testprocessInternal_OneUndefined(){
				var accumulator = createAccumulator();
				accumulator.processInternal(1);
				accumulator.processInternal(undefined);
				assert.deepEqual(accumulator.getValue(), [1]);
			},

			"should processInternal a 1 and a 0 and return [1,0]": function testprocessInternal_OneZero(){
				var accumulator = createAccumulator();
				accumulator.processInternal(1);
				accumulator.processInternal(0);
				assert.deepEqual(accumulator.getValue(), [1, 0]);
			},

			"should processInternal a 1 and a [0] and return [1,0]": function testprocessInternal_OneArrayZeroMerging(){
				var accumulator = createAccumulator();
				accumulator.processInternal(1);
				accumulator.processInternal([0], true);
				assert.deepEqual(accumulator.getValue(), [1, 0]);
			},

			"should processInternal a 1 and a 0 and throw an error if merging": function testprocessInternal_OneZeroMerging(){
				var accumulator = createAccumulator();
				accumulator.processInternal(1);
				assert.throws(function() {
					accumulator.processInternal(0, true);
				});
			}
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
