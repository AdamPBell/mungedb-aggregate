"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	Value = require("../../../lib/pipeline/Value");

exports.Value = {

	".constructor()": {

		"should throw an error when used": function() {
			assert.throws(function() {
				new Value();
			});
		}

	},

	".coerceToBool()": {

		"should coerce 0 to false": function testZeroIntToBool() {
			assert.strictEqual(Value.coerceToBool(0), false);
		},

		"should coerce -1 to true": function testNonZeroIntToBool() {
			assert.strictEqual(Value.coerceToBool(-1), true);
		},

		"should coerce 0L to false": function testZeroLongToBool() {
			assert.strictEqual(Value.coerceToBool(0e11), false);
		},

		"should coerce 5L to true": function testNonZeroLongToBool() {
			assert.strictEqual(Value.coerceToBool(5e11), true);
		},

		"should coerce 0.0 to false": function testZeroDoubleToBool() {
			assert.strictEqual(Value.coerceToBool(0.0), false);
		},

		"should coerce -1.3 to true": function testNonZeroDoubleToBool() {
			assert.strictEqual(Value.coerceToBool(-1.3), true);
		},

		"should coerce {} to true": function testObjectToBool() {
			assert.strictEqual(Value.coerceToBool({}), true);
		},

		"should coerce [] to true": function testArrayToBool() {
			assert.strictEqual(Value.coerceToBool([]), true);
		},

		"should coerce Date(0) to true": function testDateToBool() {
			assert.strictEqual(Value.coerceToBool(new Date(0)), true);
		},

		"should coerce Regex to true": function testRegexToBool() {
			assert.strictEqual(Value.coerceToBool(new RegExp("")), true);
		},

		"should coerce true to true": function testTrueToBool() {
			assert.strictEqual(Value.coerceToBool(true), true);
		},

		"should coerce false to false": function testFalseToBool() {
			assert.strictEqual(Value.coerceToBool(false), false);
		},

		"should coerce null to false": function testNullToBool() {
			assert.strictEqual(Value.coerceToBool(null), false);
		},

		"should coerce undefined to false": function testUndefinedToBool() {
			assert.strictEqual(Value.coerceToBool(null), false);
		},

	},

	".coerceToWholeNumber()": {

		"should coerce int to int": function testIntToInt() {
			assert.strictEqual(Value.coerceToWholeNumber(-5), -5);
		},

		"should coerce long to int": function testLongToInt() {
			assert.strictEqual(Value.coerceToWholeNumber(0xff00000007), 7);
		},

		"should coerce double to int": function testDoubleToInt() {
			assert.strictEqual(Value.coerceToWholeNumber(9.8), 9);
		},

		"should coerce null to int": function testNullToInt() {
			assert.strictEqual(Value.coerceToWholeNumber(null), 0);
		},

		"should coerce undefined to int": function testUndefinedToInt() {
			assert.strictEqual(Value.coerceToWholeNumber(undefined), 0);
		},

		"should error if coerce \"\" to int": function testStringToInt() {
			assert.throws(function(){
				Value.coerceToWholeNumber("");
			});
		},

		//SKIPPED: ...ToLong tests because they are the same here

	},

	".coerceToNumber()": {

		"should coerce int to double": function testIntToDouble() {
			assert.strictEqual(Value.coerceToNumber(-5), -5.0);
		},

		"should coerce long to double": function testLongToDouble() {
			assert.strictEqual(Value.coerceToNumber(0x8fffffffffffffff), 0x8fffffffffffffff);
		},

		"should coerce double to double": function testDoubleToDouble() {
			assert.strictEqual(Value.coerceToNumber(9.8), 9.8);
		},

		"should coerce null to double": function testNullToDouble() {
			assert.strictEqual(Value.coerceToNumber(null), 0);
		},

		"should coerce undefined to double": function testUndefinedToDouble() {
			assert.strictEqual(Value.coerceToNumber(undefined), 0);
		},

		"should error if coerce \"\" to double": function testStringToDouble() {
			assert.throws(function() {
				Value.coerceToNumber("");
			});
		},

	},

	".coerceToDate()": {

		"should coerce date to date": function testDateToDate() {
			assert.deepEqual(Value.coerceToDate(new Date(888)), new Date(888));
		},

		//SKIPPED: TimestampToDate because we don't have a Timestamp

		"should error if string to date": function testStringToDate() {
			assert.throws(function() {
				Value.coerceToDate("");
			});
		},

	},

	".coerceToString()": {

		"should coerce double to string": function testDoubleToString() {
			assert.strictEqual(Value.coerceToString(-0.2), "-0.2");
		},

		"should coerce int to string": function testIntToString() {
			assert.strictEqual(Value.coerceToString(-4), "-4");
		},

		"should coerce long to string": function testLongToString() {
			assert.strictEqual(Value.coerceToString(10000e11), "1000000000000000");
		},

		"should coerce string to string": function testStringToString() {
			assert.strictEqual(Value.coerceToString("fO_o"), "fO_o");
		},

		//SKIPPED: TimestampToString because we don't have a Timestamp

		"should coerce date to string": function testDateToString() {
			assert.strictEqual(Value.coerceToString(new Date(1234567890 * 1000)), "2009-02-13T23:31:30");
		},

		"should coerce null to string": function testNullToString() {
			assert.strictEqual(Value.coerceToString(null), "");
		},

		"should coerce undefined to string": function testUndefinedToString() {
			assert.strictEqual(Value.coerceToString(undefined), "");
		},

		"should throw if coerce document to string": function testDocumentToString() {
			assert.throws(function() {
				Value.coerceToString({});
			});
		},

	},

	".compare()": {

		"should test things": function testCompare() { //jshint maxstatements:52
            // BSONObjBuilder undefinedBuilder;
            // undefinedBuilder.appendUndefined( "" );
            // BSONObj undefined = undefinedBuilder.obj();

            // Undefined / null.
            assert.strictEqual(Value.compare(undefined, undefined), 0);
            assert.strictEqual(Value.compare(undefined, null), -1);
            assert.strictEqual(Value.compare(null, null), 0);

            // Undefined / null with other types.
			assert.strictEqual(Value.compare(undefined, 1), -1);
			assert.strictEqual(Value.compare(undefined, "bar"), -1);
			assert.strictEqual(Value.compare(null, -1), -1);
			assert.strictEqual(Value.compare(null, "bar"), -1);

            // Numeric types.
            assert.strictEqual(Value.compare(5, 5e11 / 1e11), 0);
            assert.strictEqual(Value.compare(-2, -2.0), 0);
            assert.strictEqual(Value.compare(90e11 / 1e11, 90.0), 0);
            assert.strictEqual(Value.compare(5, 6e11 / 1e11), -1);
            assert.strictEqual(Value.compare(-2, 2.1), -1);
            assert.strictEqual(Value.compare(90e11 / 1e11, 89.999), 1);
            assert.strictEqual(Value.compare(90, 90.1), -1);
            assert.strictEqual(Value.compare(NaN, NaN), 0);
            assert.strictEqual(Value.compare(NaN, 5), -1);

            // strings compare between numbers and objects
            assert.strictEqual(Value.compare("abc", 90), 1);
            assert.strictEqual(Value.compare("abc", {a:"b"}), -1);

            // String comparison.
            assert.strictEqual(Value.compare("", "a"), -1);
			assert.strictEqual(Value.compare("a", "a"), 0);
			assert.strictEqual(Value.compare("a", "b"), -1);
			assert.strictEqual(Value.compare("aa", "b"), -1);
			assert.strictEqual(Value.compare("bb", "b"), 1);
			assert.strictEqual(Value.compare("bb", "b"), 1);
			assert.strictEqual(Value.compare("b-", "b"), 1);
			assert.strictEqual(Value.compare("b-", "ba"), -1);
            // With a null character.
            assert.strictEqual(Value.compare("a\0", "a"), 1);

            // Object.
            assert.strictEqual(Value.compare({}, {}), 0);
            assert.strictEqual(Value.compare({x:1}, {x:1}), 0);
            assert.strictEqual(Value.compare({}, {x:1}), -1);

            // Array.
            assert.strictEqual(Value.compare([], []), 0);
			assert.strictEqual(Value.compare([0], [1]), -1);
			assert.strictEqual(Value.compare([0, 0], [1]), -1);
			assert.strictEqual(Value.compare([0], [0, 0]), -1);
			assert.strictEqual(Value.compare([0], [""]), -1);

            //TODO: OID?
            // assert.strictEqual(Value.compare(OID("abcdefabcdefabcdefabcdef"), OID("abcdefabcdefabcdefabcdef")), 0);
            // assert.strictEqual(Value.compare(OID("abcdefabcdefabcdefabcdef"), OID("010101010101010101010101")), 1);

            // Bool.
            assert.strictEqual(Value.compare(true, true), 0);
            assert.strictEqual(Value.compare(false, false), 0);
            assert.strictEqual(Value.compare(true, false), 1);

            // Date.
            assert.strictEqual(Value.compare(new Date(555), new Date(555)), 0);
            assert.strictEqual(Value.compare(new Date(555), new Date(554)), 1);
            // Negative date.
            assert.strictEqual(Value.compare(new Date(0), new Date(-1)), 1);

            // Regex.
            assert.strictEqual(Value.compare(/a/, /a/), 0);
            assert.strictEqual(Value.compare(/a/, /a/i), -1);
            assert.strictEqual(Value.compare(/a/, /aa/), -1);

            //TODO: Timestamp?
            // assert.strictEqual(Value.compare(OpTime(1234), OpTime(1234)), 0);
            // assert.strictEqual(Value.compare(OpTime(4), OpTime(1234)), -1);

            // Cross-type comparisons. Listed in order of canonical types.
            // assert.strictEqual(Value.compare(MINKEY, undefined), -1);
            assert.strictEqual(Value.compare(undefined, undefined), 0);
            // assert.strictEqual(Value.compare(undefined, BSONUndefined), 0);
            assert.strictEqual(Value.compare(undefined, null), -1);
            assert.strictEqual(Value.compare(null, 1), -1);
			assert.strictEqual(Value.compare(1, 1 /*LL*/ ), 0);
            assert.strictEqual(Value.compare(1, 1.0), 0);
            assert.strictEqual(Value.compare(1, "string"), -1);
            // assert.strictEqual(Value.compare("string", BSONSymbol("string")), 0);
            assert.strictEqual(Value.compare("string", {}), -1);
            assert.strictEqual(Value.compare({}, []), -1);
            // assert.strictEqual(Value.compare([], BSONBinData("", 0, MD5Type)), -1);
            // assert.strictEqual(Value.compare(BSONBinData("", 0, MD5Type), OID()), -1);
            // assert.strictEqual(Value.compare(OID(), false), -1);
            // assert.strictEqual(Value.compare(false, OpTime()), -1);
            // assert.strictEqual(Value.compare(OpTime(), Date_t(0)), 0, );
            // assert.strictEqual(Value.compare(Date_t(0), BSONRegEx("")), -1);
            // assert.strictEqual(Value.compare(BSONRegEx(""), BSONDBRef("", OID())), -1);
            // assert.strictEqual(Value.compare(BSONDBRef("", OID()), BSONCode("")), -1);
            // assert.strictEqual(Value.compare(BSONCode(""), BSONCodeWScope("", BSONObj())), -1);
            // assert.strictEqual(Value.compare(BSONCodeWScope("", BSONObj()), MAXKEY), -1);
		},

	},

	".consume()": {

		"should return an equivalent array, empty the original": function() {
			var inputs = [5, 6, "hi"],
				expected = [].concat(inputs), // copy
				actual = Value.consume(inputs);
			assert.deepEqual(actual, expected, "should equal input array");
			assert.notEqual(actual, inputs, "should be different array");
			assert.strictEqual(inputs.length, 0, "should be empty");
		},

		"should work given an empty array": function() {
			var inputs = [],
				expected = [].concat(inputs), // copy
				actual = Value.consume(inputs);
			assert.deepEqual(actual, expected, "should equal input array");
			assert.notEqual(actual, inputs, "should be different array");
			assert.strictEqual(inputs.length, 0, "should be empty");
		}

	},

};
