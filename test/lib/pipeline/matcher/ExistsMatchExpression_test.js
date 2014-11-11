"use strict";
var assert = require("assert"),
	ExistsMatchExpression = require("../../../../lib/pipeline/matcher/ExistsMatchExpression"),
	MatchDetails = require("../../../../lib/pipeline/matcher/MatchDetails");


module.exports = {
	"ExistsMatchExpression": {
		"should match an element": function (){
			var e = new ExistsMatchExpression();
			var s = e.init('a');

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'a':5}) );
			assert.ok( e.matches({'a':null}) );
			assert.ok( ! e.matches({'a':{}}) );
		},
		"should match a boolean":function() {
			var e = new ExistsMatchExpression();
			var s = e.init('a');

			assert.strictEqual( s.code, 'OK' );
			assert.ok( e.matches({'a':5}) );
			assert.ok( ! e.matches({}) );

		},
		"should match a number":function() {
			var e = new ExistsMatchExpression();
			var s = e.init('a');

			assert.strictEqual( s.code, 'OK' );
			assert.ok( e.matches({'a':1}) );
			assert.ok( e.matches({'a':null}) );
			assert.ok( ! e.matches({'b':1}) );
		},
		"should match an array":function() {
			var e = new ExistsMatchExpression();
			var s = e.init('a');

			assert.strictEqual( s.code, 'OK' );
			assert.ok( e.matches({'a':[4,5.5]}) );
		},
		"should yield an elemMatchKey":function() {
			var e = new ExistsMatchExpression();
			var s = e.init('a.b');
			var m = new MatchDetails();
			m.requestElemMatchKey();
			assert.strictEqual( s.code, 'OK' );

			assert.ok( ! e.matches({'a':1}, m) );
			assert.ok( ! m.hasElemMatchKey() );

			assert.ok( e.matches({'a':{'b':6}}));
			assert.ok( ! m.hasElemMatchKey() );

			assert.ok( e.matches({'a':[2, {'b':7}]}, m) );
			assert.ok( m.hasElemMatchKey() );
			assert.strictEqual('1', m.elemMatchKey() );
		},
		"should handle equivalence":function() {
			var e = new ExistsMatchExpression();
			var s = e.init('a');
			var b = new ExistsMatchExpression();
			assert.strictEqual( s.code, 'OK' );
			s = b.init('b');
			assert.strictEqual(s.code, 'OK' );
			assert.ok( e.equivalent(e) );
			assert.ok( ! e.equivalent(b) );
		}

	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

