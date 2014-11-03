"use strict";
var assert = require("assert"),
	MatchDetails = require('../../../../lib/pipeline/matcher/MatchDetails'),
	InMatchExpression = require("../../../../lib/pipeline/matcher/InMatchExpression"),
	// TODO: replace the following with a real BSONTypes at some point
	MinKey = new (function MinKey(){/*matcher does weird stuff with empty objects*/this.foo = 'bar';})(), // jshint ignore:line
	MaxKey = new (function MaxKey(){/*matcher does weird stuff with empty objects*/this.foo = 'bar';})(); // jshint ignore:line;


module.exports = {
	"InMatchExpression": {
		"should match a single element": function (){
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );
			
			e.getArrayFilterEntries().addEquality(1);
			
			assert.ok( e.matchesSingleElement(1) );	
			assert.ok( ! e.matchesSingleElement(2) );			
		},
		"should not match with an empty array": function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );

			assert.ok( ! e.matchesSingleElement(2) );
			assert.ok( ! e.matches({'a':null}) );
			assert.ok( ! e.matches({'a':1}) );
		},
		"should match with multiple elements": function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );
		
			e.getArrayFilterEntries().addEquality(1);
			e.getArrayFilterEntries().addEquality('r');
			e.getArrayFilterEntries().addEquality(true);
			e.getArrayFilterEntries().addEquality(1);

			assert.ok( e.matchesSingleElement( 1 ) );
			assert.ok( e.matchesSingleElement( 'r' ) );
			assert.ok( e.matchesSingleElement( true ) );
			assert.ok( !e.matchesSingleElement( false ) );
		},
		"should match a scalar":function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );
		
			e.getArrayFilterEntries().addEquality(5);
			
			assert.ok( e.matches({'a':5}) );
			assert.ok( ! e.matches({'a':4}) );
		},
		"should match an array":function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );

			e.getArrayFilterEntries().addEquality(5);
			
			assert.ok( e.matches({'a':[5,6]}) );
			assert.ok( ! e.matches({'a':[6,7]}) );
			assert.ok( ! e.matches({'a':[[5]]}) );
		},
		"should match null": function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );

			e.getArrayFilterEntries().addEquality(null);
			
			assert.ok( e.matches({}) );
			assert.ok( e.matches({'a':null}) );
			assert.ok( ! e.matches({'a':4}) );
			// A non-existent field is treated same way as an empty bson object
			assert.ok( e.matches({'b':4}) );
		},
		"should match undefined": function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );
			
			assert( e.getArrayFilterEntries().addEquality(undefined) !== 'OK' );
		},
		"should match MinKey": function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );

			e._arrayEntries._equalities = [MinKey];

			assert.ok( e.matches({'a':MinKey}) );
			assert.ok( ! e.matches({'a':MaxKey}) );
			assert.ok( ! e.matches({'a':4}) );
		},
		"should match MaxKey": function() {	
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );

			e._arrayEntries._equalities = [MaxKey];

			assert.ok( ! e.matches({'a':MinKey}) );
			assert.ok( e.matches({'a':MaxKey}) );
			assert.ok( ! e.matches({'a':4}) );
		},
		"should match a full array":function() {
			var e = new InMatchExpression();
			var s = e.init('a');
			assert.strictEqual( s.code,'OK' );

			e.getArrayFilterEntries().addEquality([1,2]);
			e.getArrayFilterEntries().addEquality(4);
			e.getArrayFilterEntries().addEquality(5);

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
			
			e.getArrayFilterEntries().addEquality(5);
			e.getArrayFilterEntries().addEquality(2);
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
