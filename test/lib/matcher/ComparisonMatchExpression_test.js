"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	bson = require("bson"),
	MinKey = bson.BSONPure.MinKey,
	MaxKey = bson.BSONPure.MaxKey,
	ErrorCodes = require("../../../lib/errors").ErrorCodes,
	MatchDetails = require("../../../lib/matcher/MatchDetails"),
	ComparisonMatchExpression = require("../../../lib/matcher/ComparisonMatchExpression");

exports.ComparisonMatchExpression = {

	"should properly initialize with an empty path and a number": function () {
		var e = new ComparisonMatchExpression("LT");
		assert.strictEqual(e.init("",5).code, ErrorCodes.OK);
	},
	"should not initialize when given an invalid operand": function() {
		var e = new ComparisonMatchExpression("");
		assert.strictEqual(e.init("",5).code, ErrorCodes.BAD_VALUE);
	},
	"should not initialize when given an undefined rhs": function() {
		var e = new ComparisonMatchExpression();
		assert.strictEqual(e.init("",5).code,ErrorCodes.BAD_VALUE);
		e._matchType = "LT";
		assert.strictEqual(e.init("",{}).code,ErrorCodes.BAD_VALUE);
		assert.strictEqual(e.init("",undefined).code,ErrorCodes.BAD_VALUE);
		assert.strictEqual(e.init("",{}).code,ErrorCodes.BAD_VALUE);
	},
	"should match numbers with GTE": function () {
		var e = new ComparisonMatchExpression("GTE");
		assert.strictEqual(e.init("",5).code, ErrorCodes.OK);
		assert(e.matchesSingleElement(6),"6 ≥ 5");
		assert(e.matchesSingleElement(5),"5 ≥ 5");
		assert(!e.matchesSingleElement(4),"4 !≥ 5");
		assert(!e.matchesSingleElement("foo"),"'foo' !≥ 5");
	},
	"should match with simple paths and GTE": function() {
		var e = new ComparisonMatchExpression("GTE");
		assert.strictEqual(e.init("a",5).code, ErrorCodes.OK);
		assert(e.matches({a:6}));
	},
	"should match array values with GTE": function () {
		var e = new ComparisonMatchExpression("GTE");
		assert.strictEqual(e.init("a",5).code, ErrorCodes.OK);
		assert(e.matches({a:[6,10]}),"[6,10] ≥ 5");
		assert(e.matches({a:[4,5.5]}),"[4,5.5] ≥ 5");
		assert(!e.matches({a:[1,2]}),"[1,2] !≥ 5");
		assert(e.matches({a:[1,10]}),"[1,10] ≥ 5");
	},
	"should match entire arrays with GTE": function() {
		var e = new ComparisonMatchExpression("GTE");
		assert.strictEqual(e.init("a",[5]).code, ErrorCodes.OK);
		assert(!e.matches({a:[4]}),"[4] !≥ [5]");
		assert(e.matches({a:[5]}),"[5] !≥ [5]");
		assert(e.matches({a:[6]}),"[6] !≥ [5]");
		// documents current behavior
		assert(e.matches({a:[[6]]}),"[[4]] ≥ [5]");
		assert(e.matches({a:[[6]]}),"[[5]] ≥ [5]");
		assert(e.matches({a:[[6]]}),"[[6]] ≥ [5]");
	},
	"should match null with GTE": function() {
		var e = new ComparisonMatchExpression("GTE");
		e._matchType = "GTE";
		assert.strictEqual(e.init("a",null).code, ErrorCodes.OK);
		assert(e.matches({}),"{} ≥ null");
		assert(e.matches({a:null}),"null ≥ null");
		assert(!e.matches({a:4}),"4 !≥ null");
		assert(e.matches({b:null}),"non-existent field ≥ null");
	},
	"should match null in dotted paths with GTE": function() {
		var e = new ComparisonMatchExpression("GTE");
		assert.strictEqual(e.init("a.b",null).code, ErrorCodes.OK);
		assert.ok(e.matches({}),"{} ≥ null");
		assert.ok(e.matches({a:null}),"{a:null} ≥ {a.b:null}");
		assert.ok(e.matches({a:4}),"{a:4} ≥ {a.b:null}");
		assert.ok(e.matches({a:{}}),"{a:{}} ≥ {a.b:null}");
		assert.ok(e.matches({a:[{b:null}]}),"{a:[{b:null}]} ≥ {a.b:null}");
		assert.ok(e.matches({a:[{a:4},{b:4}]}),"{a:[{a:4},{b:4}]} ≥ {a.b:null}");
		assert.ok(!e.matches({a:[4]}),"{a:[4]} !≥ {a.b:null}");
		assert.ok(!e.matches({a:[{b:4}]}),"{a:[{b:4}]} !≥ {a.b:null}");
	},
	"should match MinKeys": function() {
		var e = new ComparisonMatchExpression("GTE");
		assert.strictEqual(e.init("a",new MinKey()).code, ErrorCodes.OK);
		assert.ok(e.matches({a:new MinKey()}),"minKey ≥ minKey");
		assert.ok(e.matches({a:new MaxKey()}),"maxKey ≥ minKey");
		assert.ok(e.matches({a:4}),"4 ≥ minKey");
	},
	"should match MaxKeys": function() {
		var e = new ComparisonMatchExpression("GTE");
		assert.strictEqual(e.init("a",new MaxKey()).code, ErrorCodes.OK);
		assert.ok(e.matches({a:new MaxKey()}),"maxKey ≥ maxKey");
		assert.ok(!e.matches({a:new MinKey()}),"minKey !≥ maxKey");
		assert.ok(!e.matches({a:4},null),"4 !≥ maxKey");
	},
	"should properly set match keys": function() {
		var e = new ComparisonMatchExpression("GTE"),
			d = new MatchDetails();
		d.requestElemMatchKey();
		assert.strictEqual(e.init("a",5).code, ErrorCodes.OK);
		assert.ok(!e.matchesJSON({a:4},d),"4 !≥ 5");
		assert(!d.hasElemMatchKey());
		assert.ok(e.matchesJSON({a:6},d),"6 ≥ 5");
		assert(!d.hasElemMatchKey());
		assert.ok(e.matchesJSON({a:[2,6,5]},d),"[2,6,5] ≥ 5");
		assert(d.hasElemMatchKey());
		assert.strictEqual("1",d.elemMatchKey());
	}
};
