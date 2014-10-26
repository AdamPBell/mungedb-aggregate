"use strict";
var assert = require("assert"),
	FirstAccumulator = require("../../../../lib/pipeline/accumulators/FirstAccumulator");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.FirstAccumulator = {

	".constructor()": {

		"should create instance of Accumulator": function() {
			assert(new FirstAccumulator() instanceof FirstAccumulator);
		},

		"should throw error if called with args": function() {
			assert.throws(function() {
				new FirstAccumulator(123);
			});
		},

	},

	".create()": {

		"should return an instance of the accumulator": function() {
			assert(FirstAccumulator.create() instanceof FirstAccumulator);
		},

	},

	"#process()": {

		"should return undefined if no inputs evaluated": function testNone() {
			var acc = FirstAccumulator.create();
			assert.strictEqual(acc.getValue(), undefined);
		},

		"should return value for one input": function testOne() {
			var acc = FirstAccumulator.create();
			acc.process(5);
			assert.strictEqual(acc.getValue(), 5);
		},

		"should return missing for one missing input": function testMissing() {
			var acc = FirstAccumulator.create();
			acc.process(undefined);
			assert.strictEqual(acc.getValue(), undefined);
		},

		"should return first of two inputs": function testTwo() {
			var acc = FirstAccumulator.create();
			acc.process(5);
			acc.process(7);
			assert.strictEqual(acc.getValue(), 5);
		},

		"should return first of two inputs (even if first is missing)": function testFirstMissing() {
			var acc = FirstAccumulator.create();
			acc.process(undefined);
			acc.process(7);
			assert.strictEqual(acc.getValue(), undefined);
		},

	},

	"#getValue()": {

		"should get value the same for shard and router": function() {
			var acc = FirstAccumulator.create();
			assert.strictEqual(acc.getValue(false), acc.getValue(true));
			acc.process(123);
			assert.strictEqual(acc.getValue(false), acc.getValue(true));
		},

	},

	"#reset()": {

		"should reset to zero": function() {
			var acc = FirstAccumulator.create();
			assert.strictEqual(acc.getValue(), undefined);
			acc.process(123);
			assert.notEqual(acc.getValue(), undefined);
			acc.reset();
			assert.strictEqual(acc.getValue(), undefined);
			assert.strictEqual(acc.getValue(true), undefined);
		}

	},


	"#getOpName()": {

		"should return the correct op name; $first": function testOpName(){
			assert.equal(new FirstAccumulator().getOpName(), "$first");
		}

	},

};
