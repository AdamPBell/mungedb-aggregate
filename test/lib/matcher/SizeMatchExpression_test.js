"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ErrorCodes = require("../../../lib/errors").ErrorCodes,
	SizeMatchExpression = require("../../../lib/matcher/SizeMatchExpression"),
	MatchDetails = require("../../../lib/matcher/MatchDetails");


exports.SizeMatchExpression = {

	"should match an element": function() {
		var match={"a":[5,6]},
			notMatch={"a":[5]},
			size = new SizeMatchExpression();

		assert.strictEqual(size.init("", 2).code, ErrorCodes.OK);
		assert.ok(size.matchesSingleElement(match.a));
		assert.ok(!size.matchesSingleElement(notMatch.a));
	},

	"should not match non array": function() {
		// Non arrays do not match.
		var stringValue={"a":"z"},
			numberValue={"a":0},
			arrayValue={"a":[]},
			size = new SizeMatchExpression();

		assert.strictEqual(size.init("", 0).code, ErrorCodes.OK);
		assert.ok(!size.matchesSingleElement(stringValue.a));
		assert.ok(!size.matchesSingleElement(numberValue.a));
		assert.ok(size.matchesSingleElement(arrayValue.a));
	},

	"should match an array": function() {
		var size = new SizeMatchExpression();

		assert.strictEqual(size.init("a", 2).code, ErrorCodes.OK);
		assert.ok(size.matches({"a":[4, 5.5]}, null));
		// Arrays are not unwound to look for matching subarrays.
		assert.ok(!size.matches({"a":[4, 5.5, [1,2]]}, null));
	},

	"should match a nested array": function() {
		var size = new SizeMatchExpression();

		assert.strictEqual(size.init("a.2", 2).code, ErrorCodes.OK);
		// A numerically referenced nested array is matched.
		assert.ok(size.matches({"a":[4, 5.5, [1, 2]]}, null));
	},

	"should return the appropriate ElemMatchKey results": function() {
		var size = new SizeMatchExpression(),
			details = new MatchDetails();

		assert.strictEqual(size.init("a.b", 3).code, ErrorCodes.OK);
		details.requestElemMatchKey();
		assert.ok(!size.matches({"a":1}, details));
		assert.ok(!details.hasElemMatchKey());
		assert.ok(size.matches({"a":{"b":[1, 2, 3]}}, details));
		assert.ok(!details.hasElemMatchKey());
		assert.ok(size.matches({"a":[2, {"b":[1, 2, 3]}]}, details));
		assert.ok(details.hasElemMatchKey());
		assert.strictEqual("1", details.elemMatchKey());
	},

	"should return equivalency": function() {
		var e1 = new SizeMatchExpression(),
			e2 = new SizeMatchExpression(),
			e3 = new SizeMatchExpression();

		e1.init("a", 5);
		e2.init("a", 6);
		e3.init("v", 5);

		assert.ok(e1.equivalent(e1));
		assert.ok(!e1.equivalent(e2));
		assert.ok(!e1.equivalent(e3));
	},

};
