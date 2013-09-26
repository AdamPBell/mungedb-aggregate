"use strict";
var assert = require("assert"),
	SizeMatchExpression = require("../../../../lib/pipeline/matcher/SizeMatchExpression.js"),
	MatchDetails = require("../../../../lib/pipeline/matcher/MatchDetails.js");


module.exports = {
	"SizeMatchExpression": {
		"Should match an element": function() {
			var match={"a":[5,6]},
				notMatch={"a":[5]},
				size = new SizeMatchExpression();

			assert.strictEqual(size.init("", 2).code, 'OK');
			assert.ok(size.matchesSingleElement(match.firstElement()));
			assert.ok(!size.matchesSingleElement(notMatch.firstElement()));
		},

		"Should not match non array": function() {
			// Non arrays do not match.
			var stringValue={"a":"z"},
				numberValue={"a":0},
				arrayValue={"a":[]},
				size = new SizeMatchExpression();

			assert.strictEqual(size.init("", 0).code, 'OK');
			assert.ok(!size.matchesSingleElement(stringValue.firstElement()));
			assert.ok(!size.matchesSingleElement(numberValue.firstElement()));
			assert.ok(size.matchesSingleElement(arrayValue.firstElement()));
		},

		"Should match an array": function() {
			var size = new SizeMatchExpression();

			assert.strictEqual(size.init("a", 2).code, 'OK');
			assert.strictEqual(size.matches({"a":[4, 5.5]}, null));
			// Arrays are not unwound to look for matching subarrays.
			assert.strictEqual(!size.matches({"a":[4, 5.5, [1,2]]}, null));
		},

		"Should match a nested array": function() {
			var size = new SizeMatchExpression();

			assert.strictEqual(size.init("a.2", 2).code, 'OK');
			// A numerically referenced nested array is matched.
			assert.strictEqual(size.matches({"a":[4, 5.5, [1, 2]]}, null));
		},

		"ElemMatchKey should return the appropriate results": function() {
			var size = new SizeMatchExpression(),
				details = new MatchDetails();

			assert.strictEqual(size.init("a.b", 3).code, 'OK');
			details.requestElemMatchKey();
			assert.strictEqual(!size.matches({"a":1}, details));
			assert.ok(!details.hasElemMatchKey());
			assert.strictEqual(size.matches({"a":{"b":[1, 2, 3]}}, details));
			assert.ok(!details.hasElemMatchKey());
			assert.strictEqual(size.matches({"a":[2, {"b":[1, 2, 3]}]}, details));
			assert.ok(details.hasElemMatchKey());
			assert.strictEqual("1", details.elemMatchKey());
		},

		"Should return equivalency": function() {
			var e1 = new SizeMatchExpression(),
				e2 = new SizeMatchExpression(),
				e3 = new SizeMatchExpression();

			e1.init("a", 5);
			e2.init("a", 6);
			e3.init("v", 5);

			assert.ok(e1.equivalent(e1));
			assert.ok(!e1.equivalent(e2));
			assert.ok(!e1.equivalent(e3));
		}
	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

