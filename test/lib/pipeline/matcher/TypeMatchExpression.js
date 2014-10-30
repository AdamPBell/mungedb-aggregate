"use strict";
var assert = require("assert"),
	MatchDetails = require("../../../../lib/pipeline/matcher/MatchDetails"),
	TypeMatchExpression = require("../../../../lib/pipeline/matcher/TypeMatchExpression");


module.exports = {
	"TypeMatchExpression": {
		"should match string type": function (){
			var e = new TypeMatchExpression();
			var s = e.init('', 2 );

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches('abc') );
			assert.ok( ! e.matches(2) );

		},
		"should match null type": function() {
			var e = new TypeMatchExpression();
			var s = e.init('',10 );

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches(null) );
			assert.ok( ! e.matches(10) );

		},
		"should match unknown type": function() {
			var e = new TypeMatchExpression();
			var s = e.init('', 1024);
	
			assert.strictEqual(s.code, 'OK');
			assert.ok( ! e.matches(1024) );
			assert.ok( ! e.matches('abc') );

		},
		"should match bool type": function() {
			var e = new TypeMatchExpression();
			var s = e.init('',8 );

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches(true) );
			assert.ok( ! e.matches(8) );

		},
		"should match number type": function() {
			var e = new TypeMatchExpression();
			var s = e.init('a',1 );

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'a':[4]}) );	
			assert.ok( e.matches({'a':[4, 'a']}) );	
			assert.ok( e.matches({'a':['a', 4]}) );
			assert.ok( ! e.matches({'a':['a']}) );
			assert.ok( ! e.matches({'a':[[4]]}) );

		},
		"should match array type": function() {
			var e = new TypeMatchExpression();
			var s = e.init('a', 4);
		
			assert.strictEqual(s.code, 'OK');
			assert.ok( ! e.matches({'a':[]}) );	
			//assert.ok( ! e.matches({'a':[4, 'a']}) );
			assert.ok( e.matches({'a':[[2]]}) );
			assert.ok( ! e.matches({'a':'bar'}) );

		},
		"should match null type more": function() {
			var e = new TypeMatchExpression();
			var s = e.init('a', 10);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'a':null}) );
			assert.ok( ! e.matches({'a':4}) );
			assert.ok( ! e.matches({}));

		},
		"should match and preserve elemMatchKey": function() {
			var e = new TypeMatchExpression();
			var s = e.init('a.b', 2);
			var m = new MatchDetails();
			m.requestElemMatchKey();

			assert.strictEqual(s.code, 'OK');
			
			assert.ok( ! e.matches({'a':1}, m) );
			assert.ok( ! m.hasElemMatchKey() );
			
			assert.ok( e.matches({'a':{'b':'string'}},m) );
			assert.ok( ! m.hasElemMatchKey() );
			
			assert.ok( e.matches({'a':{'b':['string']}},m) );
			assert.ok( m.hasElemMatchKey() );
			assert.strictEqual('0', m.elemMatchKey() );

	
			assert.ok( e.matches({'a':[2, {'b':['string']}]},m) );
			assert.ok( m.hasElemMatchKey() );
			assert.strictEqual('1', m.elemMatchKey() );



		},
		"should be equivalent": function() {
			var e = new TypeMatchExpression();
			var s = e.init('a', 2);
			var b = new TypeMatchExpression();
			var c = new TypeMatchExpression();

			assert.strictEqual(s.code, 'OK');
			s = b.init('a', 1);	
			assert.strictEqual(s.code, 'OK');
			s = c.init('b', 2);
			assert.strictEqual(s.code, 'OK');
			assert.ok( e.equivalent(e) );
			assert.ok( !e.equivalent(b) );
			assert.ok( !e.equivalent(c) );
		}

	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

