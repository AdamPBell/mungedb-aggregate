"use strict";
var assert = require("assert"),
	BSON = require("bson"),
	MatchDetails = require("../../../../lib/pipeline/matcher/MatchDetails"),
	GTMatchExpression = require("../../../../lib/pipeline/matcher/GTMatchExpression");


module.exports = {
	"GTMatchExpression": {
		"should match scalars properly": function (){
			var operand = {$gt:5},
				gt = new GTMatchExpression();
			var s = gt.init("a",operand.$gt);
			assert.strictEqual(s.code, "OK");
			assert.ok(gt.matchesJSON({"a":5.5}, null));
			assert.ok(!gt.matchesJSON({"a":4}), null);
		},
		"should match array values": function (){
			var operand = {$gt:5},
				gt = new GTMatchExpression();
			var s = gt.init("a",operand.$gt);
			assert.strictEqual(s.code, "OK");
			assert.ok(gt.matchesJSON({"a":[3,5.5]}, null));
			assert.ok(!gt.matchesJSON({"a":[2,4]}), null);
		},
		"should match whole arrays": function (){
			var operand = {$gt:5},
				gt = new GTMatchExpression();
			var s = gt.init("a",operand.$gt);
			assert.strictEqual(s.code, "OK");
			assert.ok(!gt.matchesJSON({"a":[4]}, null));
			assert.ok(!gt.matchesJSON({"a":[5]}, null));
			assert.ok(gt.matchesJSON({"a":[6]}, null));
			// Nested array.
			// XXX: The following assertion documents current behavior.
			assert.ok(gt.matchesJSON({"a":[[4]]}, null));
			// XXX: The following assertion documents current behavior.
			assert.ok(gt.matchesJSON({"a":[[5]]}, null));
			assert.ok(gt.matchesJSON({"a":[[6]]}, null));
		},
		"should match null values": function (){
			var operand = {$gt:null},
				gt = new GTMatchExpression();
			var s = gt.init("a",operand.$gt);
			assert.strictEqual(s.code, "OK");
			assert.ok(!gt.matchesJSON({}, null));
			assert.ok(!gt.matchesJSON({"a":null}, null));
			assert.ok(!gt.matchesJSON({"a":4}), null);
			// A non-existent field is treated same way as an empty bson object
			assert.ok(!gt.matchesJSON({"b":4}), null);
		},
		"should match dot notation when null": function (){
			var operand = {$gt:null},
				gt = new GTMatchExpression();
			var s = gt.init("a.b",operand.$gt);
			assert.strictEqual(s.code, "OK");
			assert.ok(!gt.matchesJSON({}, null));
			assert.ok(!gt.matchesJSON({"a":null}, null));
			assert.ok(!gt.matchesJSON({"a":4}), null);
			assert.ok(!gt.matchesJSON({"a":{}}), null);
			assert.ok(!gt.matchesJSON({"a":[{b:null}]}), null);
			assert.ok(!gt.matchesJSON({"a":[{a:4},{b:4}]}), null);
			assert.ok(!gt.matchesJSON({"a":[4]}), null);
			assert.ok(!gt.matchesJSON({"a":[{b:4}]}), null);
		},
		"should match MinKey": function (){
			var operand = {a:new BSON.MinKey()},
				gt = new GTMatchExpression();
			var s = gt.init("a",operand.a);
			assert.strictEqual(s.code, "OK");
			assert.ok(!gt.matchesJSON({"a":new BSON.MinKey()}, null));
			assert.ok(gt.matchesJSON({"a":new BSON.MaxKey()}, null));
			assert.ok(gt.matchesJSON({"a":4}), null);
		},
		"should match MaxKey": function (){
			var operand = {a:new BSON.MaxKey()},
				gt = new GTMatchExpression();
			var s = gt.init("a",operand.a);
			assert.strictEqual(s.code, "OK");
			assert.ok(!gt.matchesJSON({"a":new BSON.MaxKey()}, null));
			assert.ok(!gt.matchesJSON({"a":new BSON.MinKey()}, null));
			assert.ok(!gt.matchesJSON({"a":4}), null);
		},
		"should use ElemMatchKey": function(){
			var operand = {$gt:5},
				gt = new GTMatchExpression(),
				s = gt.init("a",operand.$gt);
			assert.strictEqual(s.code, "OK");
			var details = new MatchDetails();
			details.requestElemMatchKey();
			assert(!gt.matchesJSON({a:4}, details));
			assert(!details.hasElemMatchKey());
			assert(gt.matchesJSON({a:6}, details));
			assert(!details.hasElemMatchKey());
			assert(gt.matchesJSON({a:[2,6,5]}, details));
			assert(details.hasElemMatchKey());
			assert.strictEqual(details.elemMatchKey(), "1");
		}
	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

