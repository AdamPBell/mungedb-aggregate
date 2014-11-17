"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ErrorCodes = require("../../../lib/errors").ErrorCodes,
	ModMatchExpression = require("../../../lib/matcher/ModMatchExpression"),
	MatchDetails = require("../../../lib/matcher/MatchDetails");


exports.ModMatchExpression = {

	"should match a number": function (){
		var e = new ModMatchExpression();
		var s = e.init("",3,1);

		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok( e.matches(1) );
		assert.ok( e.matches(4.0) );
		assert.ok( e.matches(68719476736) );
		assert.ok( ! e.matches(6) );
		assert.ok( ! e.matches(-2) );
	},

	"should fail init with a zero divisor": function() {
		var e = new ModMatchExpression();
		var s = e.init("", 0,  1);

		assert.strictEqual(s.code, ErrorCodes.BAD_VALUE);
	},

	"should match more numbers": function() {
		var e = new ModMatchExpression();
		var s = e.init("a", 5,2);

		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok( e.matches({"a":7.0}) );
		assert.ok( ! e.matches({"a":4}) );
	},

	"should match an array": function() {
		var e = new ModMatchExpression();
		var s = e.init("a",5,2);

		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok( e.matches({"a":[5,12]}) );
		assert.ok( ! e.matches({"a":[6,8]}) );
	},

	"should not match null": function() {
		var e = new ModMatchExpression();
		var s = e.init("a",5,2);

		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok( ! e.matches({}) );
		assert.ok( ! e.matches({"a":null}) );
	},

	"should yield an elemMatchKey": function() {
		var e = new ModMatchExpression();
		var s = e.init("a", 5,2);
		var m = new MatchDetails();
		m.requestElemMatchKey();
		assert.strictEqual(s.code, ErrorCodes.OK);

		assert.ok( ! e.matches({"a":4}, m) );
		assert.ok( ! m.hasElemMatchKey() );

		assert.ok( e.matches({"a":2}));
		assert.ok( ! m.hasElemMatchKey() );

		assert.ok( e.matches({"a":[1,2,5]}, m) );
		assert.ok( m.hasElemMatchKey() );
		assert.strictEqual("1", m.elemMatchKey() );
	},

	"should handle equivalence": function() {
		var e = new ModMatchExpression();
		var s = e.init("a",1,2);
		var b = new ModMatchExpression();
		var c = new ModMatchExpression();
		var d = new ModMatchExpression();
		assert.strictEqual(s.code, ErrorCodes.OK);

		s = b.init("a",2,2);
		assert.strictEqual(s.code, ErrorCodes.OK);

		s = c.init("a",1,1);
		assert.strictEqual(s.code, ErrorCodes.OK);

		s = d.init("b",1,2);
		assert.strictEqual(s.code, ErrorCodes.OK);

		assert.ok( e.equivalent(e) );
		assert.ok( ! e.equivalent(b) );
		assert.ok( ! e.equivalent(c) );
		assert.ok( ! e.equivalent(d) );
	},

};
