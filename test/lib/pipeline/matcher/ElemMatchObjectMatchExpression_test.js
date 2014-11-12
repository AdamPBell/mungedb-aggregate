"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ErrorCodes = require("../../../../lib/Errors").ErrorCodes,
	EqualityMatchExpression = require("../../../../lib/pipeline/matcher/EqualityMatchExpression.js"),
	ElemMatchObjectMatchExpression = require("../../../../lib/pipeline/matcher/ElemMatchObjectMatchExpression.js"),
	AndMatchExpression = require("../../../../lib/pipeline/matcher/AndMatchExpression.js"),
	MatchDetails = require("../../../../lib/pipeline/matcher/MatchDetails.js");

module.exports = {
	"ElemMatchObjectMatchExpression": {
		"Should match a single element": function(){
			var baseOperand = {"b":5},
				match= {"a":[{"b":5.0}]},
				notMatch= {"a":[{"b":6}]},
				eq = new EqualityMatchExpression(),
				op = new ElemMatchObjectMatchExpression();

			assert.strictEqual(eq.init("b", baseOperand.b).code, ErrorCodes.OK);

			assert.strictEqual(op.init("a", eq).code, ErrorCodes.OK);
			assert.ok(op.matchesSingleElement(match.a));
			assert.ok(!op.matchesSingleElement(notMatch.a));
		},

		"Should match an array of elements inside the array": function() {
			var baseOperand= {"1":5},
				match= {"a":[["s",5.0]]},
				notMatch= {"a":[[5,6]]},
				eq = new EqualityMatchExpression(),
				op = new ElemMatchObjectMatchExpression();

			assert.strictEqual(eq.init("1", baseOperand["1"]).code, ErrorCodes.OK);
			assert.strictEqual(op.init("a", eq).code, ErrorCodes.OK);
			assert.ok(op.matchesSingleElement(match.a));
			assert.ok(!op.matchesSingleElement(notMatch.a));
		},

		"Should match multiple elements in an array": function() {
			var baseOperand1 = {"b":5},
				baseOperand2 = {"b":6},
				baseOperand3 = {"c":7},
				notMatch1 = {"a":[{"b":5,"c":7}]},
				notMatch2 = {"a":[{"b":6,"c":7}]},
				notMatch3 = {"a":[{"b":[5,6]}]},
				match = {"a":[{"b":[5,6],"c":7}]},
				eq1 = new EqualityMatchExpression(),
				eq2 = new EqualityMatchExpression(),
				andOp = new AndMatchExpression(),
				eq3 = new EqualityMatchExpression(),
				op = new ElemMatchObjectMatchExpression();

			assert.strictEqual(eq1.init("b", baseOperand1.b).code, ErrorCodes.OK);
			assert.strictEqual(eq2.init("b", baseOperand2.b).code, ErrorCodes.OK);
			assert.strictEqual(eq3.init("c", baseOperand3.c).code, ErrorCodes.OK);

			andOp.add(eq1);
			andOp.add(eq2);
			andOp.add(eq3);

			assert.strictEqual(op.init("a", andOp).code, ErrorCodes.OK);
			assert.ok(!op.matchesSingleElement(notMatch1.a));
			assert.ok(!op.matchesSingleElement(notMatch2.a));
			assert.ok(!op.matchesSingleElement(notMatch3.a));
			assert.ok(op.matchesSingleElement(match.a));
		},

		"Should not match a nested non array": function() {
			var baseOperand={"b":5},
				eq = new EqualityMatchExpression(),
				op = new ElemMatchObjectMatchExpression();

			assert.strictEqual(eq.init("b", baseOperand.b).code, ErrorCodes.OK);
			assert.strictEqual(op.init("a", eq).code, ErrorCodes.OK);
			// Directly nested objects are not matched with $elemMatch.  An intervening array is
			// required.
			assert.ok(!op.matches({"a":{"b":5}},null));
			assert.ok(!op.matches({"a":{"0":{"b":5}}},null));
			assert.ok(!op.matches({"a":4},null));
		},

		"Should match an object in an array": function() {
			var baseOperand={"b":5},
				eq = new EqualityMatchExpression(),
				op = new ElemMatchObjectMatchExpression();

			assert.strictEqual(eq.init("b", baseOperand.b).code, ErrorCodes.OK);
			assert.strictEqual(op.init("a", eq).code, ErrorCodes.OK);
			assert.ok(op.matches({"a":[{"b":5}]}, null));
			assert.ok(op.matches({"a":[4,{"b":5}]}, null));
			assert.ok(op.matches({"a":[{},{"b":5}]}, null));
			assert.ok(op.matches({"a":[{"b":6},{"b":5}]}, null));
		},

		"Should match a path inside an array": function() {
			var baseOperand={"c":5},
				eq = new EqualityMatchExpression(),
				op = new ElemMatchObjectMatchExpression();

			assert.strictEqual(eq.init("c", baseOperand.c).code, ErrorCodes.OK);
			assert.strictEqual(op.init("a.b", eq).code, ErrorCodes.OK);
			assert.ok(op.matches({"a":[{"b":[{"c":5}]}]},null));
			assert.ok(op.matches({"a":[{"b":[{"c":1}]}, {"b":[{"c":5}]}]},null));
		},

		"ElemMatchKey should return the appropriate values": function() {
			var baseOperand={"c":6},
				eq = new EqualityMatchExpression(),
				op = new ElemMatchObjectMatchExpression(),
				details = new MatchDetails();

			assert.strictEqual(eq.init("c", baseOperand.c).code, ErrorCodes.OK);
			assert.strictEqual(op.init("a.b", eq).code, ErrorCodes.OK);
			details.requestElemMatchKey();
			assert.ok(!op.matches({}, details));
			assert.ok(!details.hasElemMatchKey());
			assert.ok(!op.matches({"a":{"b":[{"c":7}]}}, details));
			assert.ok(!details.hasElemMatchKey());
			assert.ok(op.matches({"a":{"b":[3, {"c":6}]}}, details));
			assert.ok(details.hasElemMatchKey());
			// The entry within the $elemMatch array is reported.
			assert.strictEqual("1", details.elemMatchKey());
			assert.ok(op.matches({"a":[1, 2, {"b":[3, 5, {"c":6}]}]}, details));
			assert.ok(details.hasElemMatchKey());
			// The entry within a parent of the $elemMatch array is reported.
			assert.strictEqual("2", details.elemMatchKey());
		},
	}
};
