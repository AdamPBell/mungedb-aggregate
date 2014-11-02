"use strict";
var assert = require("assert"),
	BSON = require("bson"),
	MatchDetails = require("../../../../lib/pipeline/matcher/MatchDetails"),
	LTEMatchExpression = require("../../../../lib/pipeline/matcher/LTEMatchExpression");

module.exports = {
	"LTEMatchExpression": {
		"should match element": function (){
			var operand = {$lte:5},
				match = {a:4.5},
				equalMatch = {a:4.5},
				notMatch = {a:6},
				notMatchWrongType = {a:"foo"},
				lte = new LTEMatchExpression();
			var s = lte.init("",operand.$lte);
			assert.strictEqual(s.code, "OK");
			assert.ok(lte.matchesSingleElement(match));
			assert.ok(lte.matchesSingleElement(equalMatch));
			assert.ok(!lte.matchesSingleElement(notMatch));
			assert.ok(!lte.matchesSingleElement(notMatchWrongType));
		},
		"should not work for invalid eoo operand": function(){
			var operand = {},
				lte = new LTEMatchExpression();
			assert.ok(lte.init("", operand).code !== "OK");
		},
		"should match scalars properly": function (){
			var operand = {$lte:5},
				lte = new LTEMatchExpression();
			var s = lte.init("a",operand.$lte);
			assert.strictEqual(s.code, "OK");
			assert.ok(lte.matchesJSON({"a":4.5}, null));
			assert.ok(!lte.matchesJSON({"a":6}), null);
		},
		"should match array values": function (){
			var operand = {$lte:5},
				lte = new LTEMatchExpression();
			var s = lte.init("a",operand.$lte);
			assert.strictEqual(s.code, "OK");
			assert.ok(lte.matchesJSON({"a":[6,4.5]}, null));
			assert.ok(!lte.matchesJSON({"a":[6,7]}), null);
		},
		"should match whole arrays": function (){
			var operand = {$lte:5},
				lte = new LTEMatchExpression();
			var s = lte.init("a",operand.$lte);
			assert.strictEqual(s.code, "OK");
			assert.ok(lte.matchesJSON({"a":[4]}, null));
			assert.ok(lte.matchesJSON({"a":[5]}, null));
			assert.ok(!lte.matchesJSON({"a":[6]}, null));
			// Nested array.
			assert.ok(lte.matchesJSON({"a":[[4]]}, null));
			assert.ok(lte.matchesJSON({"a":[[5]]}, null));
			assert.ok(!lte.matchesJSON({"a":[[6]]}, null));
		},
		"should match null values": function (){
			var operand = {$lte:null},
				lte = new LTEMatchExpression();
			var s = lte.init("a",operand.$lte);
			assert.strictEqual(s.code, "OK");
			assert.ok(lte.matchesJSON({}, null));
			assert.ok(lte.matchesJSON({"a":null}, null));
			assert.ok(!lte.matchesJSON({"a":4}), null);
			// A non-existent field is treated same way as an empty bson object
			assert.ok(lte.matchesJSON({"b":4}), null);
		},
		"should match dot notation when null": function (){
			var operand = {$lte:null},
				lte = new LTEMatchExpression();
			var s = lte.init("a.b",operand.$lte);
			assert.strictEqual(s.code, "OK");
			assert.ok(lte.matchesJSON({}, null));
			assert.ok(lte.matchesJSON({"a":null}, null));
			assert.ok(lte.matchesJSON({"a":4}), null);
			assert.ok(lte.matchesJSON({"a":{}}), null);
			assert.ok(lte.matchesJSON({"a":[{b:null}]}), null);
			assert.ok(lte.matchesJSON({"a":[{a:4},{b:4}]}), null);
			assert.ok(!lte.matchesJSON({"a":[4]}), null);
			assert.ok(!lte.matchesJSON({"a":[{b:4}]}), null);
		},
		"should match MinKey": function (){
			var operand = {a:new BSON.MinKey()},
				lte = new LTEMatchExpression();
			var s = lte.init("a",operand.a);
			assert.strictEqual(s.code, "OK");
			assert.ok(lte.matchesJSON({"a":new BSON.MinKey()}, null));
			assert.ok(!lte.matchesJSON({"a":new BSON.MaxKey()}, null));
			assert.ok(!lte.matchesJSON({"a":4}), null);
		},
		"should match MaxKey": function (){
			var operand = {a:new BSON.MaxKey()},
				lte = new LTEMatchExpression();
			var s = lte.init("a",operand.a);
			assert.strictEqual(s.code, "OK");
			assert.ok(lte.matchesJSON({"a":new BSON.MaxKey()}, null));
			assert.ok(lte.matchesJSON({"a":new BSON.MinKey()}, null));
			assert.ok(lte.matchesJSON({"a":4}), null);
		},
		"should use ElemMatchKey": function(){
			var operand = {$lte:5},
				lte = new LTEMatchExpression(),
				s = lte.init("a",operand.$lte);
			assert.strictEqual(s.code, "OK");
			var details = new MatchDetails();
			details.requestElemMatchKey();
			assert(!lte.matchesJSON({a:6}, details));
			assert(!details.hasElemMatchKey());
			assert(lte.matchesJSON({a:4}, details));
			assert(!details.hasElemMatchKey());
			assert(lte.matchesJSON({a:[6,2,5]}, details));
			assert(details.hasElemMatchKey());
			assert.strictEqual(details.elemMatchKey(), "1");
		}

	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

