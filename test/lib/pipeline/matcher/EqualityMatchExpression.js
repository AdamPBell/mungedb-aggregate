"use strict";
var assert = require("assert"),
	MatchDetails = require('../../../../lib/pipeline/matcher/MatchDetails'),
	EqualityMatchExpression = require("../../../../lib/pipeline/matcher/EqualityMatchExpression");


module.exports = {

	"EqualityMatchExpression": {

		"should initialize equality and match numbers or numbers in arrays": function (){
			var e = new EqualityMatchExpression();
			var s = e.init('x', 5);
			assert.strictEqual(s.code, 'OK');

			assert.ok(e.matches({x:5}));
			assert.ok(e.matches({x:[5]}));
			assert.ok(e.matches({x:[1,5]}));
			assert.ok(e.matches({x:[1,5,2]}));
			assert.ok(e.matches({x:[5,2]}));

			assert.ok(!e.matches({x:null}));
			assert.ok(!e.matches({x:6}));
			assert.ok(!e.matches({x:[4,2]}));
			assert.ok(!e.matches({x:[[5]]}));
		},

//NOTE: from expression_leaf_test.cpp
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

			assert.strictEqual(s.code, 'BAD_VALUE');
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

