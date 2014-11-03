"use strict";
var assert = require("assert"),
	MatchDetails = require('../../../../lib/pipeline/matcher/MatchDetails'),
	GTEMatchExpression = require("../../../../lib/pipeline/matcher/GTEMatchExpression");


module.exports = {
	"GTEMatchExpression": {
		"should match scalars and strings properly": function (){
			var e = new GTEMatchExpression();
			var s = e.init('a',5);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'a':5.5}) );
			assert.ok( e.matches({'a':5}) );
			assert.ok( ! e.matches({'a':4}) );
			assert.ok( ! e.matches({'a': 'foo'}) );
		},
		"should handle invalid End of Object Operand": function testInvalidEooOperand(){
			var e = new GTEMatchExpression();
			var s = e.init('',{});

			assert.strictEqual(s.code, 'BAD_VALUE');
		},
		"should match a pathed number":function() {
			var e = new GTEMatchExpression();
			var s = e.init('a',5);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'a':5.5}) );
			assert.ok( ! e.matches({'a':4}) );
		},
		"should match stuff in an array": function() {
			var e = new GTEMatchExpression();
			var s = e.init('a',5);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'a':[4,5.5]}) );
			assert.ok( ! e.matches({'a':[1,2]}) );
		},
		"should not match full array" : function() {
			var e = new GTEMatchExpression();
			var s = e.init('a',[5]);

			assert.strictEqual(s.code, 'OK');
			assert.ok( ! e.matches({'a':[4]}) );
			assert.ok( e.matches({'a':[5]}) );
			assert.ok( e.matches({'a':[6]}) );
		},
		"should not match null" : function() {
			var e = new GTEMatchExpression();
			var s = e.init('a',null);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({}) );
			assert.ok( e.matches({'a':null}) );
			assert.ok( ! e.matches({'a':4}) );
			assert.ok( e.matches({'b':4}) );
		},
		"should match dot notation nulls": function() {
			var e = new GTEMatchExpression();
			var s = e.init('a.b',null);

			assert.strictEqual(s.code, 'OK');
			assert.ok(e.matchesJSON({}));
			assert.ok(e.matchesJSON({a:null}));
			assert.ok(e.matchesJSON({a:{}}));
			assert.ok(e.matchesJSON({a:[{b: null}]}));
			assert.ok(e.matchesJSON({a:[{a:4}, {b:4}]}));
			assert.ok(!e.matchesJSON({a:[4]}));
			assert.ok(!e.matchesJSON({a:[{b:4}]}));
		},
		"should match MinKey": function() {
		},
		"should match MaxKey": function() {
		},
		"should handle elemMatchKey":function() {
			var e = new GTEMatchExpression();
			var s = e.init('a',5);
			var m = new MatchDetails();
			m.requestElemMatchKey();
			assert.strictEqual( s.code, 'OK' );

			assert.ok( ! e.matches({'a':4}, m) );
			assert.ok( ! m.hasElemMatchKey() );

			assert.ok( e.matches({'a':6}, m) );
			assert.ok( ! m.hasElemMatchKey() );

			assert.ok( e.matches({'a':[2,6,5]}, m));
			assert.ok( m.hasElemMatchKey());
			assert.strictEqual('1', m.elemMatchKey());
		}
	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

