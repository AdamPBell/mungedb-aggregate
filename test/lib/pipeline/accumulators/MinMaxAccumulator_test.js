"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	MinMaxAccumulator = require("../../../../lib/pipeline/accumulators/MinMaxAccumulator");

exports.MinMaxAccumulator = {

	".constructor()": {

		"should create instance of Accumulator": function() {
			assert(MinMaxAccumulator.createMax() instanceof MinMaxAccumulator);
		},

		"should throw error if called without args": function() {
			assert.throws(function() {
				new MinMaxAccumulator();
			});
		},

		"should create instance of Accumulator if called with valid sense": function() {
			new MinMaxAccumulator(-1);
			new MinMaxAccumulator(1);
		},

		"should throw error if called with invalid sense": function() {
			assert.throws(function() {
				new MinMaxAccumulator(0);
			});
		},

	},

	".createMin()": {

		"should return an instance of the accumulator": function() {
			var acc = MinMaxAccumulator.createMin();
			assert(acc instanceof MinMaxAccumulator);
			assert.strictEqual(acc._sense, 1);
		},

	},

	".createMax()": {

		"should return an instance of the accumulator": function() {
			var acc = MinMaxAccumulator.createMax();
			assert(acc instanceof MinMaxAccumulator);
			assert.strictEqual(acc._sense, -1);
		},

	},

	"#process()": {

		"Min": {

			"should return undefined if no inputs evaluated": function testNone() {
				var acc = MinMaxAccumulator.createMin();
				assert.strictEqual(acc.getValue(), undefined);
			},

			"should return value for one input": function testOne() {
				var acc = MinMaxAccumulator.createMin();
				acc.process(5);
				assert.strictEqual(acc.getValue(), 5);
			},

			"should return missing for one missing input": function testMissing() {
				var acc = MinMaxAccumulator.createMin();
				acc.process();
				assert.strictEqual(acc.getValue(), undefined);
			},

			"should return minimum of two inputs": function testTwo() {
				var acc = MinMaxAccumulator.createMin();
				acc.process(5);
				acc.process(7);
				assert.strictEqual(acc.getValue(), 5);
			},

			"should return minimum of two inputs (ignoring undefined once found)": function testLastMissing() {
				var acc = MinMaxAccumulator.createMin();
				acc.process(7);
				acc.process(undefined);
				assert.strictEqual(acc.getValue(), 7);
			},

		},

		"Max": {

			"should return undefined if no inputs evaluated": function testNone() {
				var acc = MinMaxAccumulator.createMax();
				assert.strictEqual(acc.getValue(), undefined);
			},

			"should return value for one input": function testOne() {
				var acc = MinMaxAccumulator.createMax();
				acc.process(5);
				assert.strictEqual(acc.getValue(), 5);
			},

			"should return missing for one missing input": function testMissing() {
				var acc = MinMaxAccumulator.createMax();
				acc.process();
				assert.strictEqual(acc.getValue(), undefined);
			},

			"should return maximum of two inputs": function testTwo() {
				var acc = MinMaxAccumulator.createMax();
				acc.process(5);
				acc.process(7);
				assert.strictEqual(acc.getValue(), 7);
			},

			"should return maximum of two inputs (ignoring undefined once found)": function testLastMissing() {
				var acc = MinMaxAccumulator.createMax();
				acc.process(7);
				acc.process(undefined);
				assert.strictEqual(acc.getValue(), 7);
			},

		},

	},

	"#getValue()": {

		"Min": {

			"should get value the same for shard and router": function() {
				var acc = MinMaxAccumulator.createMin();
				assert.strictEqual(acc.getValue(false), acc.getValue(true));
				acc.process(123);
				assert.strictEqual(acc.getValue(false), acc.getValue(true));
			},

		},

		"Max": {

			"should get value the same for shard and router": function() {
				var acc = MinMaxAccumulator.createMax();
				assert.strictEqual(acc.getValue(false), acc.getValue(true));
				acc.process(123);
				assert.strictEqual(acc.getValue(false), acc.getValue(true));
			},

		},

	},

	"#reset()": {

		"Min": {

			"should reset to missing": function() {
				var acc = MinMaxAccumulator.createMin();
				assert.strictEqual(acc.getValue(), undefined);
				acc.process(123);
				assert.notEqual(acc.getValue(), undefined);
				acc.reset();
				assert.strictEqual(acc.getValue(), undefined);
				assert.strictEqual(acc.getValue(true), undefined);
			},

		},

		"Max": {

			"should reset to missing": function() {
				var acc = MinMaxAccumulator.createMax();
				assert.strictEqual(acc.getValue(), undefined);
				acc.process(123);
				assert.notEqual(acc.getValue(), undefined);
				acc.reset();
				assert.strictEqual(acc.getValue(), undefined);
				assert.strictEqual(acc.getValue(true), undefined);
			},

		},

	},

	"#getOpName()": {

		"Min": {

			"should return the correct op name; $min": function() {
				assert.equal(MinMaxAccumulator.createMin().getOpName(), "$min");
			},

		},
		"Max":{

			"should return the correct op name; $max": function() {
				assert.equal(MinMaxAccumulator.createMax().getOpName(), "$max");
			},

		},

	},

};
