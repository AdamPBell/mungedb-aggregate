"use strict";
var assert = require("assert"),
	MatchDetails = require('../../../../lib/pipeline/matcher/MatchDetails'),
	LTMatchExpression = require("../../../../lib/pipeline/matcher/LTMatchExpression");


module.exports = {
	"LTMatchExpression": {
		"should match scalars and strings properly": function (){
			var e = new LTMatchExpression();
			var s = e.init('x',5);
			
			assert.strictEqual(s.code, 'OK');
			assert.ok( ! e.matches({'x':5}) );
			assert.ok( e.matches({'x':4}) );
			assert.ok( ! e.matches({'x':6}) );
			assert.ok( ! e.matches({'x': 'eliot'}) );
		},
		"should handle invalid End of Object Operand": function testInvalidEooOperand(){
			var e = new LTMatchExpression();
			var s = e.init('',{});

			assert.strictEqual(s.code, 'BAD_VALUE');
		},
		"should match a pathed number":function() {
			var e = new LTMatchExpression();
			var s = e.init('a',5);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'a':4.5}) );
			assert.ok( ! e.matches({'a':6}) );
		},
		"should match an empty pathed number":function() {
			var e = new LTMatchExpression();
			var s = e.init('',5);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'':4.5}) );
			assert.ok( ! e.matches({'':6}) );
		},
		"should match stuff in an array": function() {
			var e = new LTMatchExpression();
			var s = e.init('a',5);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'a':[6,4.5]}) );
			assert.ok( ! e.matches({'a':[6,7]}) );
		},
		"should not match full array" : function() {
			var e = new LTMatchExpression();
			var s = e.init('a',[5]);

			assert.strictEqual(s.code, 'OK');
			assert.ok( e.matches({'a':[4]}) );
		},
		"should not match null" : function() {
			var e = new LTMatchExpression();
			var s = e.init('a',null);
		
			assert.strictEqual(s.code, 'OK');
			assert.ok( ! e.matches({}) );
			assert.ok( ! e.matches({'a':null}) );
			assert.ok( ! e.matches({'a':4}) );
		},
		"should handle elemMatchKey":function() {
			var e = new LTMatchExpression();
			var s = e.init('a',5);
			var m = new MatchDetails();
			m.requestElemMatchKey();
			assert.strictEqual( s.code, 'OK' );

			assert.ok( ! e.matches({'a':6}, m) );
			assert.ok( ! m.hasElemMatchKey() );

			assert.ok( e.matches({'a':4}, m) );
			assert.ok( ! m.hasElemMatchKey() );

			assert.ok( e.matches({'a':[6,2,5]}, m));
			assert.ok( m.hasElemMatchKey());
			assert.strictEqual('1', m.elemMatchKey());
		}



	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

