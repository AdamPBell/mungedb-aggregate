"use strict";
var assert = require("assert"),
	MatchDetails = require('../../../../lib/pipeline/matcher/MatchDetails'),
	EqualityMatchExpression = require("../../../../lib/pipeline/matcher/EqualityMatchExpression"),
	MinKey = new (function MinKey(){/*matcher does weird stuff with empty objects*/this.foo = 'bar';})(), //TODO: replace me with a real BSONType at some point
	MaxKey = new (function MaxKey(){/*matcher does weird stuff with empty objects*/this.foo = 'bar';})(); //TODO: replace me with a real BSONType at some point


module.exports = {

	"EqualityMatchExpression": {

		"should match elements": function testMatchesElement(){
			var operand = {a:5},
				match = {a:5.0},
				notMatch = {a:6};

			var eq = new EqualityMatchExpression();
			eq.init("a", operand.a);

			assert.ok(eq.matches(match));
			assert.ok(!eq.matches(notMatch));

			assert.ok(eq.equivalent(eq));
		},

		"should handle invalid End of Object Operand": function testInvalidEooOperand(){
			var e = new EqualityMatchExpression();
			var s = e.init('',{});

			assert.ok(!(s.code === 'OK'));
		},
		"should match a pathed number":function() {
			var e = new EqualityMatchExpression();
			var s = e.init('a',5);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'a':5}) );
			assert.ok( ! e.matches({'a':4}) );
		},
		"should match stuff in an array": function() {
			var e = new EqualityMatchExpression();
			var s = e.init('a',5);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'a':[5,6]}) );
			assert.ok( ! e.matches({'a':[6,7]}) );
		},
		"should match on a longer path": function() {
			var e = new EqualityMatchExpression();
			var s = e.init('a.b',5);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'a':{'b':5}}) );
			assert.ok( e.matches({'a':{'b':[5]}}) );
			assert.ok( e.matches({'a':[{'b':5}]}) );
		},
		"should match in an array": function() {
			var e = new EqualityMatchExpression();
			var s = e.init('a.0',5);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'a':[5]}) );
			assert.ok( ! e.matches({'a':[[5]]}) );
		},
		"should match null" : function() {
			var e = new EqualityMatchExpression();
			var s = e.init('a',null);
		
			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({}) );
			assert.ok( e.matches({'a':null}) );
			assert.ok( ! e.matches({'a':4}) );
			assert.ok( e.matches({'b':4}) );
		},
    //// This test documents how the matcher currently works,
    //// not necessarily how it should work ideally.
		"should match nested nulls" : function(){
			var e = new EqualityMatchExpression();
			var s = e.init('a.b',null);
		
			assert.strictEqual(s.code, 'OK');
			// null matches any empty object that is on a subpath of a.b
			assert.ok( e.matches({}) );
			assert.ok( e.matches({'a':{}}) );
			assert.ok( e.matches({'a':[{}]}) );
			assert.ok( e.matches({'a':{'b':null}} ) );
			// b does not exist as an element in array under a.
			assert.ok( !e.matches({'a':[]}) );
			assert.ok( !e.matches({'a':[null]}) );
			assert.ok( !e.matches({'a':[1,2]}) );
			// a.b exists but is not null.
			assert.ok( !e.matches({'a':{'b':4}} ) );
			assert.ok( !e.matches({'a':{'b':{}}} ) );
			// A non-existent field is treated same way as an empty bson object
			debugger;
			assert.ok( e.matches({'b':4} ) );
		},
		"should match MinKey" : function(){
			var e = new EqualityMatchExpression();
			var s = e.init('a',MinKey);
			assert.ok( e.matches({'a': MinKey}) );
			assert.ok( !e.matches({'a':MaxKey}) );
			assert.ok( !e.matches({'a':4}) );
		},
		"should match MaxKey" : function(){
			var e = new EqualityMatchExpression();
			var s = e.init('a',MaxKey);
			assert.ok( e.matches({'a':MaxKey}) );
			assert.ok( !e.matches({'a': MinKey}) );
			assert.ok( !e.matches({'a':4}) );
		},
		
		"should match full array" : function() {
			var e = new EqualityMatchExpression();
			var s = e.init('a',[1,2]);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'a':[1,2]}) );
			assert.ok( ! e.matches({'a':[1,2,3]}) );
			assert.ok( ! e.matches({'a':[1]}) );
			assert.ok( ! e.matches({'a':1}) );
		},
		"should match a nested array": function() {
			var e = new EqualityMatchExpression();
			var s = e.init('a.b.c.d',3);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({a:{b:[{c:[{d:1},{d:2}]},{c:[{d:3}]}]}}) );
		},
		"should handle elemMatchKey":function() {
			var e = new EqualityMatchExpression();
			var s = e.init('a', 5);
			var m = new MatchDetails();

			m.requestElemMatchKey();

			assert.strictEqual( s.code, 'OK' );

			assert.ok( ! e.matches({'a':4}, m) );
			assert.ok( ! m.hasElemMatchKey() );

			assert.ok( e.matches({'a':5}, m) );
			assert.ok( ! m.hasElemMatchKey() );

			assert.ok( e.matches({'a':[1,2,5]}, m));
			assert.ok( m.hasElemMatchKey());
			assert.strictEqual('2', m.elemMatchKey());
		},
		"should handle equivalence":function() {
			var a = new EqualityMatchExpression();
			var b = new EqualityMatchExpression();
			var c = new EqualityMatchExpression();
			

			assert.strictEqual( a.init('a',5).code, 'OK' );
			assert.strictEqual( b.init('a',5).code, 'OK' );
			assert.strictEqual( c.init('c',4).code, 'OK' );

			assert.ok( a.equivalent(a) );
			assert.ok( a.equivalent(b) );
			assert.ok( ! a.equivalent(c) );
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
