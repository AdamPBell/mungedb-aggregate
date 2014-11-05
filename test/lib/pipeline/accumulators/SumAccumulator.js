"use strict";
var assert = require("assert"),
	SumAccumulator = require("../../../../lib/pipeline/accumulators/SumAccumulator");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.SumAccumulator = {

	".constructor()": {

		"should create instance of Accumulator": function() {
			assert(new SumAccumulator() instanceof SumAccumulator);
		},

		"should throw error if called with args": function() {
			assert.throws(function() {
				new SumAccumulator(123);
			});
		},

	},

	".create()": {

		"should return an instance of the accumulator": function() {
			assert(SumAccumulator.create() instanceof SumAccumulator);
		},

	},

	"#process()": {

		"should return 0 if no inputs evaluated": function testNone() {
			var acc = SumAccumulator.create();
			assert.strictEqual(acc.getValue(), 0);
		},

		"should return value for one int input": function testOneInt() {
			var acc = SumAccumulator.create();
			acc.process(5);
			assert.strictEqual(acc.getValue(), 5);
		},

		"should return value for one long input": function testOneLong() {
			var acc = SumAccumulator.create();
			acc.process(6e24);
			assert.strictEqual(acc.getValue(), 6e24);
		},

		"should return value for one large long input": function testOneLargeLong() {
			var acc = SumAccumulator.create();
			acc.process(6e42);
			assert.strictEqual(acc.getValue(), 6e42);
		},

		"should return value for one double input": function testOneDouble() {
			var acc = SumAccumulator.create();
			acc.process(7.0);
			assert.strictEqual(acc.getValue(), 7.0);
		},

		"should return value for one fractional double input": function testNanDouble() {
			var acc = SumAccumulator.create();
			acc.process(NaN);
			assert.notEqual(acc.getValue(), acc.getValue()); // NaN is unequal to itself.
		},

		beforeEach: function() { // used in the tests below
			this.getSumValueFor = function(first, second) { // kind of like TwoOperandBase
				var acc = SumAccumulator.create();
				for (var i = 0, l = arguments.length; i < l; i++) {
					acc.process(arguments[i]);
				}
				return acc.getValue();
			};
		},

		"should return sum for two ints": function testIntInt() {
			var summand1 = 4,
				summand2 = 5,
				expected = 9;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for two ints (overflow)": function testIntIntOverflow() {
			var summand1 = 32767,
				summand2 = 10,
				expected = 32767 + 10;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for two ints (negative overflow)": function testIntIntNegativeOverflow() {
			var summand1 = 32767,
				summand2 = -10,
				expected = 32767 + -10;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for int and long": function testIntLong() {
			var summand1 = 4,
				summand2 = 5e24,
				expected = 4 + 5e24;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for max int and long (no int overflow)": function testIntLongNoIntOverflow() {
			var summand1 = 32767,
				summand2 = 1e24,
				expected = 32767 + 1e24;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for int and max long (long overflow)": function testIntLongLongOverflow() {
			var summand1 = 1,
				summand2 = 9223372036854775807,
				expected = 1 + 9223372036854775807;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for long and long": function testLongLong() {
			var summand1 = 4e24,
				summand2 = 5e24,
				expected = 4e24 + 5e24;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for max long and max long (overflow)": function testLongLongOverflow() {
			var summand1 = 9223372036854775807,
				summand2 = 9223372036854775807,
				expected = 9223372036854775807 + 9223372036854775807;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for int and double": function testIntDouble() {
			var summand1 = 4,
				summand2 = 5.5,
				expected = 9.5;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for int and NaN as NaN": function testIntNanDouble() {
			var summand1 = 4,
				summand2 = NaN,
				expected = NaN;
			assert(isNaN(this.getSumValueFor(summand1, summand2)));
			assert(isNaN(this.getSumValueFor(summand2, summand1)));
		},

		"should return sum for int and double (no int overflow)": function testIntDoubleNoIntOverflow() {
			var summand1 = 32767,
				summand2 = 1.0,
				expected = 32767 + 1.0;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for long and double": function testLongDouble() {
			var summand1 = 4e24,
				summand2 = 5.5,
				expected = 4e24 + 5.5;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for max long and double (no long overflow)": function testLongDoubleNoLongOverflow() {
			var summand1 = 9223372036854775807,
				summand2 = 1.0,
				expected = 9223372036854775807 + 1.0;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for double and double": function testDoubleDouble() {
			var summand1 = 2.5,
				summand2 = 5.5,
				expected = 8.0;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for double and double (overflow)": function testDoubleDoubleOverflow() {
			var summand1 = Number.MAX_VALUE,
				summand2 = Number.MAX_VALUE,
				expected = Infinity;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for int and long and double": function testIntLongDouble() {
			assert.strictEqual(this.getSumValueFor(5, 99, 0.2), 104.2);
		},

		"should return sum for a negative value": function testNegative() {
			var summand1 = 5,
				summand2 = -8.8,
				expected = 5 - 8.8;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for long and negative int": function testLongIntNegative() {
			var summand1 = 5e24,
				summand2 = -6,
				expected = 5e24 - 6;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for int and null": function testIntNull() {
			var summand1 = 5,
				summand2 = null,
				expected = 5;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for int and undefined": function testIntUndefined() {
			var summand1 = 9,
				summand2, // = undefined,
				expected = 9;
			assert.strictEqual(this.getSumValueFor(summand1, summand2), expected);
			assert.strictEqual(this.getSumValueFor(summand2, summand1), expected);
		},

		"should return sum for long long max and long long max and 1": function testNoOverflowBeforeDouble() {
			var actual = this.getSumValueFor(9223372036854775807, 9223372036854775807, 1.0),
				expected = 9223372036854775807 + 9223372036854775807;
			assert.strictEqual(actual, expected);
		},

	},

	"#getValue()": {

		"should get value the same for shard and router": function() {
			var acc = SumAccumulator.create();
			assert.strictEqual(acc.getValue(false), acc.getValue(true));
			acc.process(123);
			assert.strictEqual(acc.getValue(false), acc.getValue(true));
		},

	},

	"#reset()": {

		"should reset to 0": function() {
			var acc = SumAccumulator.create();
			assert.strictEqual(acc.getValue(), 0);
			acc.process(123);
			assert.notEqual(acc.getValue(), 0);
			acc.reset();
			assert.strictEqual(acc.getValue(), 0);
			assert.strictEqual(acc.getValue(true), 0);
		},

	},

	"#getOpName()": {

		"should return the correct op name; $sum": function() {
			assert.equal(SumAccumulator.create().getOpName(), "$sum");
		}

	},

};
