"use strict";
var assert = require("assert"),
	LastAccumulator = require("../../../../lib/pipeline/accumulators/LastAccumulator");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.LastAccumulator = {

	".constructor()": {

		"should create instance of Accumulator": function() {
			assert(new LastAccumulator() instanceof LastAccumulator);
		},

		"should throw error if called with args": function() {
			assert.throws(function() {
				new LastAccumulator(123);
			});
		},

	},

	".create()": {

		"should return an instance of the accumulator": function() {
			assert(LastAccumulator.create() instanceof LastAccumulator);
		},

	},

	"#process()": {

		"should return undefined if no inputs evaluated": function testNone() {
			var acc = LastAccumulator.create();
			assert.strictEqual(acc.getValue(), undefined);
		},

		"should return value for one input": function testOne() {
			var acc = LastAccumulator.create();
			acc.process(5);
			assert.strictEqual(acc.getValue(), 5);
		},

		"should return missing for one missing input": function testMissing() {
			var acc = LastAccumulator.create();
			acc.process(undefined);
			assert.strictEqual(acc.getValue(), undefined);
		},

		"should return last of two inputs": function testTwo() {
			var acc = LastAccumulator.create();
			acc.process(5);
			acc.process(7);
			assert.strictEqual(acc.getValue(), 7);
		},

		"should return last of two inputs (even if last is missing)": function testFirstMissing() {
			var acc = LastAccumulator.create();
			acc.process(7);
			acc.process(undefined);
			assert.strictEqual(acc.getValue(), undefined);
		},

	},

	"#getValue()": {

		"should get value the same for shard and router": function() {
			var acc = LastAccumulator.create();
			assert.strictEqual(acc.getValue(false), acc.getValue(true));
			acc.process(123);
			assert.strictEqual(acc.getValue(false), acc.getValue(true));
		},

	},

	"#reset()": {

		"should reset to missing": function() {
			var acc = LastAccumulator.create();
			assert.strictEqual(acc.getValue(), undefined);
			acc.process(123);
			assert.notEqual(acc.getValue(), undefined);
			acc.reset();
			assert.strictEqual(acc.getValue(), undefined);
			assert.strictEqual(acc.getValue(true), undefined);
		},

	},

	"#getOpName()": {

		"should return the correct op name; $last": function() {
			assert.equal(new LastAccumulator().getOpName(), "$last");
		},

	},

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
