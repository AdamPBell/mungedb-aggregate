"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ErrorCodes = require("../../../lib/errors").ErrorCodes,
	matcher = require("../../../lib/matcher/"),
	ElemMatchObjectMatchExpression = matcher.ElemMatchObjectMatchExpression,
	ElemMatchValueMatchExpression = matcher.ElemMatchValueMatchExpression,
	MatchDetails = matcher.MatchDetails,
	LTMatchExpression = matcher.LTMatchExpression,
	GTMatchExpression = matcher.GTMatchExpression;


exports.ElemMatchValueMatchExpression = {

	"should match a single element": function() {
		var baseOperand={"$gt":5},
			match={"a":[6]},
			notMatch={"a":[4]},
			gt = new GTMatchExpression(),
			op = new ElemMatchValueMatchExpression();

		assert.strictEqual(gt.init("", baseOperand.$gt).code, ErrorCodes.OK);
		assert.strictEqual(op.init("a", gt).code, ErrorCodes.OK);
		assert.ok(op.matchesSingleElement(match.a));
		assert.ok(!op.matchesSingleElement(notMatch.a));
	},

	"should match multiple elements": function() {
		var baseOperand1={"$gt":1},
			baseOperand2={"$lt":10},
			notMatch1={"a":[0,1]},
			notMatch2={"a":[10,11]},
			match={"a":[0,5,11]},
			gt = new GTMatchExpression(),
			lt = new LTMatchExpression(),
			op = new ElemMatchValueMatchExpression();

		assert.strictEqual(gt.init("", baseOperand1.$gt).code, ErrorCodes.OK);
		assert.strictEqual(lt.init("", baseOperand2.$lt).code, ErrorCodes.OK);

		assert.strictEqual(op.init("a").code, ErrorCodes.OK);
		op.add(gt);
		op.add(lt);

		assert.ok(!op.matchesSingleElement(notMatch1.a));
		assert.ok(!op.matchesSingleElement(notMatch2.a));
		assert.ok(op.matchesSingleElement(match.a));
	},

	"should match a non array": function() {
		var baseOperand={"$gt":5},
			gt = new GTMatchExpression(),
			op = new ElemMatchObjectMatchExpression();

		assert.strictEqual(gt.init("", baseOperand.$gt).code, ErrorCodes.OK);
		assert.strictEqual(op.init("a", gt).code, ErrorCodes.OK);
		// Directly nested objects are not matched with $elemMatch.  An intervening array is
		// required.
		assert.ok(!op.matches({"a":6},null));
		assert.ok(!op.matches({"a":{"0":6}},null));
	},

	"should match an array scalar": function() {
		var baseOperand={"$gt":5},
			gt = new GTMatchExpression(),
			op = new ElemMatchValueMatchExpression();

		assert.strictEqual(gt.init("", baseOperand.$gt).code, ErrorCodes.OK);
		assert.strictEqual(op.init("a", gt).code, ErrorCodes.OK);
		assert.ok(op.matches({"a":[6]},null));
		assert.ok(op.matches({"a":[4,6]},null));
		assert.ok(op.matches({"a":[{},7]},null));
	},

	"should match multiple named values": function() {
		var baseOperand={"$gt":5},
			gt = new GTMatchExpression(),
			op = new ElemMatchValueMatchExpression();

		assert.strictEqual(gt.init("", baseOperand.$gt).code, ErrorCodes.OK);
		assert.strictEqual(op.init("a.b", gt).code, ErrorCodes.OK);
		assert.ok(op.matches({"a":[{"b":[6]}]}, null));
		assert.ok(op.matches({"a":[{"b":[4]}, {"b":[4,6]}]}, null));
	},

	"ElemMatchKey should return the appropriate values": function() {
		var baseOperand={"$gt":6},
			gt = new GTMatchExpression(),
			op = new ElemMatchValueMatchExpression(),
			details = new MatchDetails();

		assert.strictEqual(gt.init("", baseOperand.$gt).code, ErrorCodes.OK);
		assert.strictEqual(op.init("a.b", gt).code, ErrorCodes.OK);
		details.requestElemMatchKey();
		assert.ok(!op.matches({}, details));
		assert.ok(!details.hasElemMatchKey());
		assert.ok(!op.matches({"a":{"b":[2]}}, details));
		assert.ok(!details.hasElemMatchKey());
		assert.ok(op.matches({"a":{"b":[3,7]}}, details));
		assert.ok(details.hasElemMatchKey());
		// The entry within the $elemMatch array is reported.
		assert.strictEqual("1", details.elemMatchKey());
		assert.ok(op.matches({"a":[1, 2, {"b":[3,7]}]}, details));
		assert.ok(details.hasElemMatchKey());
		// The entry within a parent of the $elemMatch array is reported.
		assert.strictEqual("2", details.elemMatchKey());
	},

};
