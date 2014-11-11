"use strict";
var assert = require("assert"),
	BSON = require("bson"),
	MatchDetails = require("../../../../lib/pipeline/matcher/MatchDetails"),
	LTMatchExpression = require("../../../../lib/pipeline/matcher/LTMatchExpression");


module.exports = {
	"LTMatchExpression": {
		"should match element": function (){
			var operand = {$lt:5},
				match = {a:4.5},
				notMatch = {a:6},
				notMatchEqual = {a:5},
				notMatchWrongType = {a:"foo"},
				lt = new LTMatchExpression();
			var s = lt.init("",operand.$lt);
			assert.strictEqual(s.code, "OK");
			assert.ok(lt.matchesSingleElement(match.a));
			assert.ok(!lt.matchesSingleElement(notMatch.a));
			assert.ok(!lt.matchesSingleElement(notMatchEqual.a));
			assert.ok(!lt.matchesSingleElement(notMatchWrongType.a));
		},
		"should not work for invalid eoo operand": function(){
			var operand = {},
				lt = new LTMatchExpression();
			assert.ok(lt.init("", operand).code !== "OK");
		},
		"should match scalars properly": function (){
			var operand = {$lt:5},
				lt = new LTMatchExpression();
			var s = lt.init("a",operand.$lt);
			assert.strictEqual(s.code, "OK");
			assert.ok(lt.matchesJSON({"a":4.5}, null));
			assert.ok(!lt.matchesJSON({"a":6}), null);
		},
		"should match scalars with empty keys properly": function (){
			var operand = {$lt:5},
				lt = new LTMatchExpression();
			var s = lt.init("",operand.$lt);
			assert.strictEqual(s.code, "OK");
			assert.ok(lt.matchesJSON({"":4.5}, null));
			assert.ok(!lt.matchesJSON({"":6}), null);
		},
		"should match array value": function() {
			var e = new LTMatchExpression();
			var s = e.init("a",5);

			assert.strictEqual(s.code, "OK");
			assert.ok( e.matchesJSON({"a":[6,4.5]}) );
			assert.ok( ! e.matchesJSON({"a":[6,7]}) );
		},
		"should match whole array" : function() {
			var e = new LTMatchExpression(),
				s = e.init("a",[5]);

			assert.strictEqual(s.code, "OK");
			assert.ok(e.matchesJSON({"a":[4]}));
			assert.ok(!e.matchesJSON({"a":[5]}));
			assert.ok(!e.matchesJSON({"a":[6]}));
			// Nested array.
			assert.ok(e.matchesJSON({"a":[[4]]}));
			assert.ok(!e.matchesJSON({"a":[[5]]}));
			assert.ok(!e.matchesJSON({"a":[[6]]}));
		},
		"should match null" : function() {
			var e = new LTMatchExpression();
			var s = e.init("a",null);

			assert.strictEqual(s.code, "OK");
			assert.ok( ! e.matchesJSON({}) );
			assert.ok( ! e.matchesJSON({"a":null}) );
			assert.ok( ! e.matchesJSON({"a":4}) );
			// A non-existent field is treated same way as an empty bson object
			assert.ok( ! e.matchesJSON({"b":4}) );
		},
		"should match dot notation null" : function() {
			var e = new LTMatchExpression();
			var s = e.init("a.b",null);

			assert.strictEqual(s.code, "OK");
			assert.ok( ! e.matchesJSON({}) );
			assert.ok( ! e.matchesJSON({"a":null}) );
			assert.ok( ! e.matchesJSON({"a":4}) );
			assert.ok( ! e.matchesJSON({"a":{}}) );
			assert.ok( ! e.matchesJSON({"a":[{b:null}]}) );
			assert.ok( ! e.matchesJSON({"a":[{a:4},{b:4}]}) );
			assert.ok( ! e.matchesJSON({"a":[4]}) );
			assert.ok( ! e.matchesJSON({"a":[{b:4}]}) );
		},
		"should match MinKey": function (){
			var operand = {a:new BSON.MinKey()},
				e = new LTMatchExpression();
			var s = e.init("a",operand.a);
			assert.strictEqual(s.code, "OK");
			assert.ok(!e.matchesJSON({"a":new BSON.MinKey()}, null));
			assert.ok(!e.matchesJSON({"a":new BSON.MaxKey()}, null));
			assert.ok(!e.matchesJSON({"a":4}), null);
		},
		"should match MaxKey": function (){
			var operand = {a:new BSON.MaxKey()},
				e = new LTMatchExpression();
			var s = e.init("a",operand.a);
			assert.strictEqual(s.code, "OK");
			assert.ok(!e.matchesJSON({"a":new BSON.MaxKey()}, null));
			assert.ok(e.matchesJSON({"a":new BSON.MinKey()}, null));
			assert.ok(e.matchesJSON({"a":4}), null);
		},
		"should handle elemMatchKey":function() {
			var e = new LTMatchExpression();
			var s = e.init("a",5);
			var m = new MatchDetails();
			m.requestElemMatchKey();
			assert.strictEqual( s.code, "OK" );

			assert.ok( ! e.matchesJSON({"a":6}, m) );
			assert.ok( ! m.hasElemMatchKey() );

			assert.ok( e.matchesJSON({"a":4}, m) );
			assert.ok( ! m.hasElemMatchKey() );

			assert.ok( e.matchesJSON({"a":[6,2,5]}, m));
			assert.ok( m.hasElemMatchKey());
			assert.strictEqual("1", m.elemMatchKey());
		}
	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

