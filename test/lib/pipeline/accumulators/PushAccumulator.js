"use strict";
var assert = require("assert"),
	PushAccumulator = require("../../../../lib/pipeline/accumulators/PushAccumulator");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));


exports.PushAccumulator = {

	".constructor()": {

		"should create instance of accumulator": function() {
			assert(new PushAccumulator() instanceof PushAccumulator);
		},

		"should throw error if called with args": function() {
			assert.throws(function() {
				new PushAccumulator(123);
			});
		},

	},

	".create()": {

		"should return an instance of the accumulator": function() {
			assert(PushAccumulator.create() instanceof PushAccumulator);
		},

	},

	"#process()": {

		"should return empty array if no inputs evaluated": function() {
			var acc = PushAccumulator.create();
			assert.deepEqual(acc.getValue(), []);
		},

		"should return array of one value for one input": function() {
			var acc = PushAccumulator.create();
			acc.process(1);
			assert.deepEqual(acc.getValue(), [1]);
		},

		"should return array of two values for two inputs": function() {
			var acc = PushAccumulator.create();
			acc.process(1);
			acc.process(2);
			assert.deepEqual(acc.getValue(), [1,2]);
		},

		"should return array of two values for two inputs (including null)": function() {
			var acc = PushAccumulator.create();
			acc.process(1);
			acc.process(null);
			assert.deepEqual(acc.getValue(), [1, null]);
		},

		"should return array of one value for two inputs if one is undefined": function() {
			var acc = PushAccumulator.create();
			acc.process(1);
			acc.process(undefined);
			assert.deepEqual(acc.getValue(), [1]);
		},

		"should return array of two values from two separate mergeable inputs": function() {
			var acc = PushAccumulator.create();
			acc.process([1], true);
			acc.process([0], true);
			assert.deepEqual(acc.getValue(), [1, 0]);
		},

		"should throw error if merging non-array": function() {
			var acc = PushAccumulator.create();
			assert.throws(function() {
				acc.process(0, true);
			});
			assert.throws(function() {
				acc.process("foo", true);
			});
		},

	},

	"#getValue()": {

		"should get value the same for shard and router": function() {
			var acc = PushAccumulator.create();
			assert.strictEqual(acc.getValue(false), acc.getValue(true));
			acc.process(123);
			assert.strictEqual(acc.getValue(false), acc.getValue(true));
		},

	},

	"#reset()": {

		"should reset to empty array": function() {
			var acc = PushAccumulator.create();
			assert.deepEqual(acc.getValue(), []);
			acc.process(123);
			assert.notDeepEqual(acc.getValue(), []);
			acc.reset();
			assert.deepEqual(acc.getValue(), []);
			assert.deepEqual(acc.getValue(true), []);
		},

	},

	"#getOpName()": {

		"should return the correct op name; $push": function(){
			assert.strictEqual(new PushAccumulator().getOpName(), "$push");
		},

	},

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
