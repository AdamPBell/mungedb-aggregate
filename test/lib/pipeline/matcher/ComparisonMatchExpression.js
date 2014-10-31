"use strict";
var assert = require("assert"),
	MatchDetails = require("../../../../lib/pipeline/matcher/MatchDetails"),
	ComparisonMatchExpression = require("../../../../lib/pipeline/matcher/ComparisonMatchExpression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.ComparisonMatchExpression = {

	"should properly initialize with an empty path and a number": function () {
		var e = new ComparisonMatchExpression();
		e._matchType = 'LT';
		assert.strictEqual(e.init('',5).code,'OK');
	},
	"should not initialize when given an invalid operand": function() {
		var e = new ComparisonMatchExpression();
		e._matchType = '';
		assert.strictEqual(e.init('',5).code, 'BAD_VALUE');
	},
	"should not initialize when given an undefined rhs": function() {
		var e = new ComparisonMatchExpression();
		assert.strictEqual(e.init('',5).code,'BAD_VALUE');
		e._matchType = 'LT';
		assert.strictEqual(e.init('',{}).code,'BAD_VALUE');
		assert.strictEqual(e.init('',undefined).code,'BAD_VALUE');
		assert.strictEqual(e.init('',{}).code,'BAD_VALUE');
	},
	"should match numbers with GTE": function () {
		var e = new ComparisonMatchExpression();
		e._matchType = 'GTE';
		assert.strictEqual(e.init('',5).code,'OK');
		assert.ok(e.matchesSingleElement(6),'6 ≥ 5');
		assert.ok(e.matchesSingleElement(5),'5 ≥ 5');
		assert.ok(!e.matchesSingleElement(4),'4 !≥ 5');
		assert.ok(!e.matchesSingleElement('foo'),"'foo' !≥ 5");
	},
	"should match with simple paths and GTE": function() {
		var e = new ComparisonMatchExpression();
		e._matchType = 'GTE';
		assert.strictEqual(e.init('a',5).code,'OK');
		assert.ok(e.matches({'a':6}));
	},
	"should match array values with GTE": function () {
		var e = new ComparisonMatchExpression();
		e._matchType = 'GTE';
		assert.strictEqual(e.init('a',5).code,'OK');
		assert.ok(e.matches({'a':[6,10]}),'[6,10] ≥ 5');
		assert.ok(e.matches({'a':[4,5.5]}),'[4,5.5] ≥ 5');
		assert.ok(!e.matches({'a':[1,2]}),'[1,2] !≥ 5');
		assert.ok(e.matches({'a':[1,10]}),'[1,10] ≥ 5');
	},
	"should match entire arrays with GTE": function() {
		var e = new ComparisonMatchExpression();
		e._matchType = 'GTE';
		assert.strictEqual(e.init('a',[5]).code,'OK');
		assert.ok(!e.matches({'a':[4]}),'[4] !≥ [5]');
		assert.ok(e.matches({'a':[5]}),'[5] !≥ [5]');
		assert.ok(e.matches({'a':[6]}),'[6] !≥ [5]');
		// documents current behavior
		assert.ok(e.matches({'a':[[6]]}),'[[4]] ≥ [5]');
		assert.ok(e.matches({'a':[[6]]}),'[[5]] ≥ [5]');
		assert.ok(e.matches({'a':[[6]]}),'[[6]] ≥ [5]');
	},
	"should match null with GTE": function() {
		var e = new ComparisonMatchExpression();
		e._matchType = 'GTE';
		assert.strictEqual(e.init('a',null).code,'OK');
		assert.ok(e.matches({}),'{} ≥ null');
		assert.ok(e.matches({'a':null}),'null ≥ null');
		assert.ok(!e.matches({'a':4}),'4 !≥ null');
		assert.ok(e.matches({'b':null}),'non-existent field ≥ null');
	},
	"should match null in dotted paths with GTE": function() {
		var e = new ComparisonMatchExpression();
		e._matchType = 'GTE';
		assert.strictEqual(e.init('a.b',null).code,'OK');
		assert.ok(e.matches({}),'{} ≥ null');
		assert.ok(e.matches({'a':null}),'{a:null} ≥ {a.b:null}');
		assert.ok(e.matches({'a':4}),'{a:4} ≥ {a.b:null}');
		assert.ok(e.matches({'a':{}}),'{a:{}} ≥ {a.b:null}');
		assert.ok(e.matches({'a':[{'b':null}]}),'{a:[{b:null}]} ≥ {a.b:null}');
		assert.ok(e.matches({'a':[{'a':4},{'b':4}]}),'{a:[{a:4},{b:4}]} ≥ {a.b:null}');
		assert.ok(!e.matches({'a':[4]}),'{a:[4]} !≥ {a.b:null}');
		assert.ok(!e.matches({'a':[{'b':4}]}),'{a:[{b:4}]} !≥ {a.b:null}');
	},
	"should match some weird stuff": function() {
		var e = new ComparisonMatchExpression(),
			d = new MatchDetails();
		e._matchType = 'GTE';
		d.requestElemMatchKey();
		assert.strictEqual(e.init('a',5).code,'OK');
		assert.ok(!e.matchesJSON({'a':4},d),'4 !≥ 5');
		assert(!d.hasElemMatchKey());
		assert.ok(e.matchesJSON({'a':6},d),'6 ≥ 5');
		assert(!d.hasElemMatchKey());
		assert.ok(e.matchesJSON({'a':[2,6,5]},d),'[2,6,5] ≥ 5');
		assert(d.hasElemMatchKey());
		assert.strictEqual('1',d.elemMatchKey());
	}
};
