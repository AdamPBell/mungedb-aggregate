"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	BSON = require("bson"),
	ErrorCodes = require("../../../lib/errors").ErrorCodes,
	MatchDetails = require("../../../lib/matcher/MatchDetails"),
	LTEMatchExpression = require("../../../lib/matcher/LTEMatchExpression");


exports.LTEMatchExpression = {

	"should match element": function() {
		var operand = {$lte:5},
			match = {a:4.5},
			equalMatch = {a:5},
			notMatch = {a:6},
			notMatchWrongType = {a:"foo"},
			lte = new LTEMatchExpression();
		var s = lte.init("",operand.$lte);
		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok(lte.matchesSingleElement(match.a));
		assert.ok(lte.matchesSingleElement(equalMatch.a));
		assert.ok(!lte.matchesSingleElement(notMatch.a));
		assert.ok(!lte.matchesSingleElement(notMatchWrongType.a));
	},

	"should not work for invalid eoo operand": function() {
		var operand = {},
			lte = new LTEMatchExpression();
		assert.ok(lte.init("", operand).code !== ErrorCodes.OK);
	},

	"should match scalars properly": function() {
		var operand = {$lte:5},
			lte = new LTEMatchExpression();
		var s = lte.init("a",operand.$lte);
		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok(lte.matchesJSON({"a":4.5}, null));
		assert.ok(!lte.matchesJSON({"a":6}), null);
	},

	"should match array value": function() {
		var e = new LTEMatchExpression();
		var s = e.init("a",5);

		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok( e.matchesJSON({"a":[6,4.5]}) );
		assert.ok( ! e.matchesJSON({"a":[6,7]}) );
	},

	"should match whole array" : function() {
		var e = new LTEMatchExpression(),
			s = e.init("a",[5]);

		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok(e.matchesJSON({"a":[4]}));
		assert.ok(e.matchesJSON({"a":[5]}));
		assert.ok(!e.matchesJSON({"a":[6]}));
		assert.ok(e.matchesJSON({"a":[[4]]}));
		assert.ok(e.matchesJSON({"a":[[5]]}));
		assert.ok(!e.matchesJSON({"a":[[6]]}));
	},

	"should match null" : function() {
		var e = new LTEMatchExpression();
		var s = e.init("a",null);

		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok( e.matchesJSON({}) );
		assert.ok( e.matchesJSON({"a":null}) );
		assert.ok( ! e.matchesJSON({"a":4}) );
		// A non-existent field is treated same way as an empty bson object
		assert.ok( e.matchesJSON({"b":4}) );
	},

	"should match dot notation null" : function() {
		var e = new LTEMatchExpression();
		var s = e.init("a.b",null);

		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok( e.matchesJSON({}) );
		assert.ok( e.matchesJSON({"a":null}) );
		assert.ok( e.matchesJSON({"a":4}) );
		assert.ok( e.matchesJSON({"a":{}}) );
		assert.ok( e.matchesJSON({"a":[{b:null}]}) );
		assert.ok( e.matchesJSON({"a":[{a:4},{b:4}]}) );
		assert.ok( ! e.matchesJSON({"a":[4]}) );
		assert.ok( ! e.matchesJSON({"a":[{b:4}]}) );
	},

	"should match MinKey": function() {
		var operand = {a:new BSON.MinKey()},
			e = new LTEMatchExpression();
		var s = e.init("a",operand.a);
		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok(e.matchesJSON({"a":new BSON.MinKey()}, null));
		assert.ok(!e.matchesJSON({"a":new BSON.MaxKey()}, null));
		assert.ok(!e.matchesJSON({"a":4}), null);
	},

	"should match MaxKey": function() {
		var operand = {a:new BSON.MaxKey()},
			e = new LTEMatchExpression();
		var s = e.init("a",operand.a);
		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok(e.matchesJSON({"a":new BSON.MaxKey()}, null));
		assert.ok(e.matchesJSON({"a":new BSON.MinKey()}, null));
		assert.ok(e.matchesJSON({"a":4}), null);
	},

	"should handle elemMatchKey":function() {
		var e = new LTEMatchExpression();
		var s = e.init("a",5);
		var m = new MatchDetails();
		m.requestElemMatchKey();
		assert.strictEqual( s.code, ErrorCodes.OK );

		assert.ok( ! e.matchesJSON({"a":6}, m) );
		assert.ok( ! m.hasElemMatchKey() );

		assert.ok( e.matchesJSON({"a":4}, m) );
		assert.ok( ! m.hasElemMatchKey() );

		assert.ok( e.matchesJSON({"a":[6,2,5]}, m));
		assert.ok( m.hasElemMatchKey());
		assert.strictEqual("1", m.elemMatchKey());
	},

};
