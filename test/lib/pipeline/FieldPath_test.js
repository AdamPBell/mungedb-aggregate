"use strict";
var assert = require("assert"),
	FieldPath = require("../../../lib/pipeline/FieldPath");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.FieldPath = {

	"constructor(path)": {

		"should throw Error if given an empty path String": function testEmpty() {
			assert.throws(function() {
				new FieldPath("");
			});
		},

		"should throw Error if given an empty path Array": function testEmptyVector() {
			assert.throws(function() {
				new FieldPath([]);
			});
		},

		"should accept simple paths as a String (without dots)": function testSimple() {
			var path = new FieldPath("foo");
			assert.equal(path.getPathLength(), 1);
			assert.equal(path.getFieldName(0), "foo");
			assert.equal(path.getPath(false), "foo");
			assert.equal(path.getPath(true), "$foo");
		},

		"should accept simple paths as an Array of one item": function testSimpleVector() {
			var path = new FieldPath(["foo"]);
			assert.equal(path.getPathLength(), 1);
			assert.equal(path.getFieldName(0), "foo");
			assert.equal(path.getPath(false), "foo");
		},

		"should throw Error if given a '$' String": function testDollarSign() {
			assert.throws(function() {
				new FieldPath("$");
			});
		},

		"should throw Error if given a '$'-prefixed String": function testDollarSignPrefix() {
			assert.throws(function() {
				new FieldPath("$a");
			});
		},

		"should accept paths as a String with one dot": function testDotted() {
			var path = new FieldPath("foo.bar");
			assert.equal(path.getPathLength(), 2);
			assert.equal(path.getFieldName(0), "foo");
			assert.equal(path.getFieldName(1), "bar");
			assert.equal(path.getPath(false), "foo.bar");
			assert.equal(path.getPath(true), "$foo.bar");
		},

		"should throw Error if given a path Array with items containing a dot": function testVectorWithDot() {
			assert.throws(function() {
				new FieldPath(["fo.o"]);
			});
		},

		"should accept paths Array of two items": function testTwoFieldVector() {
			var path = new FieldPath(["foo", "bar"]);
			assert.equal(path.getPathLength(), 2);
			assert.equal(path.getPath(false), "foo.bar");
		},

		"should throw Error if given a path String and 2nd field is a '$'-prefixed String": function testDollarSignPrefixSecondField() {
			assert.throws(function() {
				new FieldPath("a.$b");
			});
		},

		"should accept path String when it contains two dots": function testTwoDotted() {
			var path = new FieldPath("foo.bar.baz");
			assert.equal(path.getPathLength(), 3);
			assert.equal(path.getFieldName(0), "foo");
			assert.equal(path.getFieldName(1), "bar");
			assert.equal(path.getFieldName(2), "baz");
			assert.equal(path.getPath(false), "foo.bar.baz");
		},

		"should throw Error if given path String ends in a dot": function testTerminalDot() {
			assert.throws(function() {
				new FieldPath("foo.");
			});
		},

		"should throw Error if given path String begins in a dot": function testPrefixDot() {
			assert.throws(function() {
				new FieldPath(".foo");
			});
		},

		"should throw Error if given path String contains adjacent dots": function testAdjacentDots() {
			assert.throws(function() {
				new FieldPath("foo..bar");
			});
		},

		"should accept path String containing one letter between two dots": function testLetterBetweenDots() {
			var path = new FieldPath("foo.a.bar");
			assert.equal(path.getPathLength(), 3);
			assert.equal(path.getPath(false), "foo.a.bar");
		},

		"should throw Error if given path String contains a null character": function testNullCharacter() {
			assert.throws(function() {
				new FieldPath("foo.b\0r");
			});
		},

		"should throw Error if given path Array contains an item with a null character": function testVectorNullCharacter() {
			assert.throws(function() {
				new FieldPath(["foo", "b\0r"]);
			});
		}

	},

	"#tail()": {

		"should be able to get all but last part of field part of path with 2 fields": function testTail() {
			var path = new FieldPath("foo.bar").tail();
			assert.equal(path.getPathLength(), 1);
			assert.equal(path.getPath(), "bar");
		},

		"should be able to get all but last part of field part of path with 3 fields": function testTailThreeFields() {
			var path = new FieldPath("foo.bar.baz").tail();
			assert.equal(path.getPathLength(), 2);
			assert.equal(path.getPath(), "bar.baz");
		}

	}

};
