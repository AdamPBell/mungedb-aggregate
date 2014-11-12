"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	AvgAccumulator = require("../../../../lib/pipeline/accumulators/AvgAccumulator");

exports.AvgAccumulator = {

	".constructor()": {

		"should not throw Error when constructing without args": function() {
			new AvgAccumulator();
		},

	},

	"#process()": {

		"should allow numbers": function() {
			assert.doesNotThrow(function() {
				var acc = AvgAccumulator.create();
				acc.process(1);
			});
		},

		"should ignore non-numbers": function() {
			assert.doesNotThrow(function() {
				var acc = AvgAccumulator.create();
				acc.process(true);
				acc.process("Foo");
				acc.process(new Date());
				acc.process({});
				acc.process([]);
			});
		},

		"router": {

			"should handle result from one shard": function testOneShard() {
				var acc = AvgAccumulator.create();
				acc.process({subTotal:3.0, count:2}, true);
				assert.deepEqual(acc.getValue(), 3.0 / 2);
			},

			"should handle result from two shards": function testTwoShards() {
				var acc = AvgAccumulator.create();
				acc.process({subTotal:6.0, count:1}, true);
				acc.process({subTotal:5.0, count:2}, true);
				assert.deepEqual(acc.getValue(), 11.0 / 3);
			},

		},

	},

	".create()": {

		"should create an instance": function() {
			assert(AvgAccumulator.create() instanceof AvgAccumulator);
		},

	},

	"#getValue()": {

		"should return 0 if no inputs evaluated": function testNoDocsEvaluated() {
			var acc = AvgAccumulator.create();
			assert.equal(acc.getValue(), 0);
		},

		"should return one int": function testOneInt() {
			var acc = AvgAccumulator.create();
			acc.process(3);
			assert.equal(acc.getValue(), 3);
		},

		"should return one long": function testOneLong() {
			var acc = AvgAccumulator.create();
			acc.process(-4e24);
			assert.equal(acc.getValue(), -4e24);
		},

		"should return one double": function testOneDouble() {
			var acc = AvgAccumulator.create();
			acc.process(22.6);
			assert.equal(acc.getValue(), 22.6);
		},

		"should return avg for two ints": function testIntInt() {
			var acc = AvgAccumulator.create();
			acc.process(10);
			acc.process(11);
			assert.equal(acc.getValue(), 10.5);
		},

		"should return avg for int and double": function testIntDouble() {
			var acc = AvgAccumulator.create();
			acc.process(10);
			acc.process(11.0);
			assert.equal(acc.getValue(), 10.5);
		},

		"should return avg for two ints w/o overflow": function testIntIntNoOverflow() {
			var acc = AvgAccumulator.create();
			acc.process(32767);
			acc.process(32767);
			assert.equal(acc.getValue(), 32767);
		},

		"should return avg for two longs w/o overflow": function testLongLongOverflow() {
			var acc = AvgAccumulator.create();
			acc.process(2147483647);
			acc.process(2147483647);
			assert.equal(acc.getValue(), (2147483647 + 2147483647) / 2);
		},

		"shard": {

			"should return avg info for int": function testShardInt() {
				var acc = AvgAccumulator.create();
				acc.process(3);
				assert.deepEqual(acc.getValue(true), {subTotal:3.0, count:1});
			},

			"should return avg info for long": function testShardLong() {
				var acc = AvgAccumulator.create();
				acc.process(5);
				assert.deepEqual(acc.getValue(true), {subTotal:5.0, count:1});
			},

			"should return avg info for double": function testShardDouble() {
				var acc = AvgAccumulator.create();
				acc.process(116.0);
				assert.deepEqual(acc.getValue(true), {subTotal:116.0, count:1});
			},

			beforeEach: function() { // used in the tests below
				this.getAvgValueFor = function(a, b) { // kind of like TwoOperandBase
					var acc = AvgAccumulator.create();
					for (var i = 0, l = arguments.length; i < l; i++) {
						acc.process(arguments[i]);
					}
					return acc.getValue(true);
				};
			},

			"should return avg info for two ints w/ overflow": function testShardIntIntOverflow() {
				var operand1 = 32767,
					operand2 = 3,
					expected = {subTotal: 32767 + 3.0, count: 2};
				assert.deepEqual(this.getAvgValueFor(operand1, operand2), expected);
				assert.deepEqual(this.getAvgValueFor(operand2, operand1), expected);
			},

			"should return avg info for int and long": function testShardIntLong() {
				var operand1 = 5,
					operand2 = 3e24,
					expected = {subTotal: 5 + 3e24, count: 2};
				assert.deepEqual(this.getAvgValueFor(operand1, operand2), expected);
				assert.deepEqual(this.getAvgValueFor(operand2, operand1), expected);
			},

			"should return avg info for int and double": function testShardIntDouble() {
				var operand1 = 5,
					operand2 = 6.2,
					expected = {subTotal: 5 + 6.2, count: 2};
				assert.deepEqual(this.getAvgValueFor(operand1, operand2), expected);
				assert.deepEqual(this.getAvgValueFor(operand2, operand1), expected);
			},

			"should return avg info for long and double": function testShardLongDouble() {
				var operand1 = 5e24,
					operand2 = 1.0,
					expected = {subTotal: 5e24 + 1.0, count: 2};
				assert.deepEqual(this.getAvgValueFor(operand1, operand2), expected);
				assert.deepEqual(this.getAvgValueFor(operand2, operand1), expected);
			},

			"should return avg info for int and long and double": function testShardIntLongDouble() {
				var operand1 = 1,
					operand2 = 2e24,
					operand3 = 4.0,
					expected = {subTotal: 1 + 2e24 + 4.0, count: 3};
				assert.deepEqual(this.getAvgValueFor(operand1, operand2, operand3), expected);
			},

		},

		"should handle NaN": function() {
			var acc = AvgAccumulator.create();
			acc.process(NaN);
			acc.process(1);
			assert(isNaN(acc.getValue()));
			acc = AvgAccumulator.create();
			acc.process(1);
			acc.process(NaN);
			assert(isNaN(acc.getValue()));
		},

		"should handle null as 0": function() {
			var acc = AvgAccumulator.create();
			acc.process(null);
			assert.equal(acc.getValue(), 0);
		}

	},

	"#reset()": {

		"should reset to zero": function() {
			var acc = AvgAccumulator.create();
			assert.equal(acc.getValue(), 0);
			acc.process(123);
			assert.notEqual(acc.getValue(), 0);
			acc.reset();
			assert.equal(acc.getValue(), 0);
			assert.deepEqual(acc.getValue(true), {subTotal:0, count:0});
		}

	},

	"#getOpName()": {

		"should return the correct op name; $avg": function() {
			assert.equal(new AvgAccumulator().getOpName(), "$avg");
		}

	},

};
