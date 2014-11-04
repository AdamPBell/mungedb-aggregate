"use strict";
var assert = require("assert"),
	MatchDetails = require("../../../../lib/pipeline/matcher/MatchDetails"),
	LTEMatchExpression = require("../../../../lib/pipeline/matcher/LTEMatchExpression");


module.exports = {
	"LTEMatchExpression": {
		"should match element": function (){
			var operand = {$lte:5},
				match = {a:4.5},
				equalMatch = {a:5},
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
		"should handle invalid End of Object Operand": function testInvalidEooOperand(){
			var e = new LTEMatchExpression();
			var s = e.init("",{});

			assert.strictEqual(s.code, "BAD_VALUE");
		},
		"should match a pathed number":function() {
			var e = new LTEMatchExpression();
			var s = e.init("a",5);

			assert.strictEqual(s.code, "OK");
			assert.ok( e.matches({"a":4.5}) );
			assert.ok( ! e.matches({"a":6}) );
		},
		"should match stuff in an array": function() {
			var e = new LTEMatchExpression();
			var s = e.init("a",5);

			assert.strictEqual(s.code, "OK");
			assert.ok( e.matches({"a":[6,4.5]}) );
			assert.ok( ! e.matches({"a":[6,7]}) );
		},
		"should not match full array" : function() {
			var e = new LTEMatchExpression();
			var s = e.init("a",[5]);

			assert.strictEqual(s.code, "OK");
			assert.ok(e.matches({"a":[4]}) );
		},
		"should not match null" : function() {
			var e = new LTEMatchExpression();
			var s = e.init("a",null);

			assert.strictEqual(s.code, "OK");
			assert.ok( e.matches({}) );
			assert.ok( e.matches({"a":null}) );
			assert.ok( ! e.matches({"a":4}) );
		},
		"should handle elemMatchKey":function() {
			var e = new LTEMatchExpression();
			var s = e.init("a",5);
			var m = new MatchDetails();
			m.requestElemMatchKey();
			assert.strictEqual( s.code, "OK" );

			assert.ok( ! e.matches({"a":6}, m) );
			assert.ok( ! m.hasElemMatchKey() );

			assert.ok( e.matches({"a":4}, m) );
			assert.ok( ! m.hasElemMatchKey() );

			assert.ok( e.matches({"a":[6,2,5]}, m));
			assert.ok( m.hasElemMatchKey());
			assert.strictEqual("1", m.elemMatchKey());
		}

	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

