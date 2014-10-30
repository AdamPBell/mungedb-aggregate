"use strict";
var assert = require("assert"),
	MatchDetails = require('../../../../lib/pipeline/matcher/MatchDetails'),
	InMatchExpression = require("../../../../lib/pipeline/matcher/InMatchExpression");


module.exports = {
	"InMatchExpression": {
		"should match a single element": function (){
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );
			
			e._arrayEntries._equalities = [1];
			
			assert.ok( e.matchesSingleElement(1) );	
			assert.ok( ! e.matchesSingleElement(2) );			
		},
		"should not match with an empty array": function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );
			
			e._arrayEntries._equalities = [];

			assert.ok( ! e.matchesSingleElement(2) );
			assert.ok( ! e.matches({'a':null}) );
			assert.ok( ! e.matches({'a':1}) );
		},
		"should match with multiple elements": function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );
		
			e._arrayEntries._equalities = [1,'r',true,1];

			assert.ok( e.matchesSingleElement( 1 ) );
			assert.ok( e.matchesSingleElement( 'r' ) );
			assert.ok( e.matchesSingleElement( true ) );
			assert.ok( !e.matchesSingleElement( false ) );
		},
		"should match a scalar":function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );
		
			e._arrayEntries._equalities = [5];
			
			assert.ok( e.matches({'a':5}) );
			assert.ok( ! e.matches({'a':4}) );
		},
		"should match an array":function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );

			e._arrayEntries._equalities = [5];
			
			assert.ok( e.matches({'a':[5,6]}) );
			assert.ok( ! e.matches({'a':[6,7]}) );
			assert.ok( ! e.matches({'a':[[5]]}) );
		},
		"should match null": function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );

			e._arrayEntries._equalities = [null];
			
			assert.ok( e.matches({}) );
			assert.ok( e.matches({'a':null}) );
			assert.ok( ! e.matches({'a':4}) );
		},
		/*"should match MinKey": function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			var fakeCon = {'name':'MinKey'}, minkey = {}, maxkey = {};
			minkey.contructor = fakeCon;
			minkey.constructor.name='MinKey';
			maxkey.constructor = fakeCon;
			maxkey.constructor.name = 'MaxKey';
			assert.strictEqual( s.code,'OK' );

			e._arrayEntries._equalities = [minkey];

			assert.ok( e.matches({'a':minkey}) );
			assert.ok( ! e.matches({'a':maxkey}) );
			assert.ok( ! e.matches({'a':4}) );
		},
		"should match MaxKey": function() {	
			var e = new InMatchExpression();
			var s = e.init('a');
			var minkey = {}, maxkey = {};
			minkey.contructor = {};
			minkey.constructor.name='MinKey';
			maxkey.constructor = {};
			maxkey.constructor.name = 'MaxKey';
			assert.strictEqual( s.code,'OK' );

			e._arrayEntries._equalities = [minkey];

			assert.ok( ! e.matches({'a':minkey}) );
			assert.ok( e.matches({'a':maxkey}) );
			assert.ok( ! e.matches({'a':4}) );
		},*/
		"should match a full array":function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );

			e._arrayEntries._equalities = [[1,2],4,5];

			assert.ok( e.matches({'a':[1,2]}) );
			assert.ok( ! e.matches({'a':[1,2,3]}) );
			assert.ok( ! e.matches({'a':[1]}) );
			assert.ok( ! e.matches({'a':1}) );
		},
		"should match elemmatchKey": function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			var m = new MatchDetails();

			assert.strictEqual( s.code,'OK' );
			
			e._arrayEntries._equalities = [5,2];
			m.requestElemMatchKey();
			assert.ok( !e.matches({'a':4}, m) );
			assert.ok( !m.hasElemMatchKey() );
			assert.ok( e.matches({'a':5}, m) );
			assert.ok( !m.hasElemMatchKey() );
			assert.ok( e.matches({'a':[1,2,5]}, m ));
			assert.ok( m.hasElemMatchKey() );
			assert.strictEqual( m.elemMatchKey(), '1' );
		
		}

	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

