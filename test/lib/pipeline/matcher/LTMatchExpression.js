"use strict";
var assert = require("assert"),
	BSON = require("bson"),
	MatchDetails = require('../../../../lib/pipeline/matcher/MatchDetails'),
	LTMatchExpression = require("../../../../lib/pipeline/matcher/LTMatchExpression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

module.exports = {
	"LTMatchExpression": {
		"should match scalars and strings properly": function (){
			var e = new LTMatchExpression();
			var s = e.init('a',5);

			assert.strictEqual(s.code, 'OK');
			assert.ok( ! e.matchesJSON({'a':5}) );
			assert.ok( e.matchesJSON({'a':4.5}) );
			assert.ok( ! e.matchesJSON({'a':6}) );
			assert.ok( ! e.matchesJSON({'a':5}) );
			assert.ok( ! e.matchesJSON({'a': 'foo'}) );
		},
		"should handle invalid End of Object Operand": function testInvalidEooOperand(){
			var e = new LTMatchExpression();
			var s = e.init('',{});

			assert.strictEqual(s.code, 'BAD_VALUE');
		},
		"should match a scalar":function() {
			var e = new LTMatchExpression();
			var s = e.init('a',5);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matchesJSON({'a':4.5}) );
			assert.ok( ! e.matchesJSON({'a':6}) );
		},
		"should match an empty key":function() {
			var e = new LTMatchExpression();
			var s = e.init('',5);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matchesJSON({'':4.5}) );
			assert.ok( ! e.matchesJSON({'':6}) );
		},
		"should match array values": function() {
			var e = new LTMatchExpression();
			var s = e.init('a',5);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matchesJSON({'a':[6,4.5]}) );
			assert.ok( ! e.matchesJSON({'a':[6,7]}) );
		},
		"should match whole array" : function() {
			var e = new LTMatchExpression();
			var s = e.init('a',[5]);

			assert.strictEqual(s.code, 'OK');
			assert.ok(e.matchesJSON({'a':[4]}));
			assert.ok(!e.matchesJSON({'a':[5]}));
			assert.ok(!e.matchesJSON({'a':[6]}));
			// Nested arrays
			assert.ok(!e.matchesJSON({'a':[[4]]}));
			assert.ok(!e.matchesJSON({'a':[[5]]}));
			assert.ok(!e.matchesJSON({'a':[[6]]}));
		},
		"should not match null" : function() {
			var e = new LTMatchExpression();
			var s = e.init('a',null);

			assert.strictEqual(s.code, 'OK');
			assert.ok( ! e.matchesJSON({}) );
			assert.ok( ! e.matchesJSON({'a':null}) );
			assert.ok( ! e.matchesJSON({'a':4}) );
			// A non-existent field is treated same way as an empty bson object
			assert.ok( ! e.matchesJSON({'b':4}) );
		},
		"should handle elemMatchKey":function() {
			var e = new LTMatchExpression();
			var s = e.init('a',5);
			var m = new MatchDetails();
			m.requestElemMatchKey();
			assert.strictEqual( s.code, 'OK' );

			assert.ok( ! e.matchesJSON({'a':6}, m) );
			assert.ok( ! m.hasElemMatchKey() );

			assert.ok( e.matchesJSON({'a':4}, m) );
			assert.ok( ! m.hasElemMatchKey() );

			assert.ok( e.matchesJSON({'a':[6,2,5]}, m));
			assert.ok( m.hasElemMatchKey());
			assert.strictEqual('1', m.elemMatchKey());
		},
		"should match dot notation with nulls": function() {
			var e = new LTMatchExpression();
			var s = e.init('a.b',null);

			assert.ok(!e.matchesJSON({}));
			assert.ok(!e.matchesJSON({a:null}));
			assert.ok(!e.matchesJSON({a:{}}));
			assert.ok(!e.matchesJSON({a:[{b: null}]}));
			assert.ok(!e.matchesJSON({a:[{a:4}, {b:4}]}));
			assert.ok(!e.matchesJSON({a:[4]}));
			assert.ok(!e.matchesJSON({a:[{b:4}]}));
		},
		"should match MinKey": function() {
			var e = new LTMatchExpression();
			var s = e.init('a', new BSON.MinKey());

			assert.ok(!e.matchesJSON({a: new BSON.MinKey()}, null));
			assert.ok(!e.matchesJSON({a: new BSON.MaxKey()}, null));
			assert.ok(!e.matchesJSON({a: 4}, null));
		},
		"should match MaxKey": function() {
			var e = new LTMatchExpression();
			var s = e.init('a', new BSON.MaxKey());

			assert.ok(!e.matchesJSON({a: new BSON.MaxKey()}));
			assert.ok(e.matchesJSON({a: new BSON.MinKey()}));
			assert.ok(e.matchesJSON({a: 4}));
		},
		"should match with ElemMatchKey": function() {
			var e = new LTMatchExpression()
			var s = e.init('a', 5);

			assert.ok(!e.matchesJSON({a: 6}));
			assert.ok(e.matchesJSON({a: 4}));
			assert.ok(e.matchesJSON({a: [6,2,5]}));
		},
	}
};
