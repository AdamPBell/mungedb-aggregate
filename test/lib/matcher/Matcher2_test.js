"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	MatchDetails = require("../../../lib/matcher/MatchDetails"),
	Matcher2 = require("../../../lib/matcher/Matcher2");

exports.Matcher2 = {

	"Constructor": function Constructor() {
		new Matcher2({"a":1});
	},

	"Basic": function Basic() {
		var query = {"a":"b"},
			m = new Matcher2(query);
		assert(m.matches(query));
	},

	"DoubleEqual": function DoubleEqual() {
		var query = {"a":5},
			m = new Matcher2(query);
		assert(m.matches(query));
	},

	"MixedNumericEqual": function MixedNumericEqual() {	//not sure if we need this.  Same as DoubleEqual in munge
		var query = {"a":5},
			m = new Matcher2(query);
		assert(m.matches(query));
	},

	"MixedNumericGt": function MixedNumericGt() {
		var query = {"a":{"$gt":4}},
			m = new Matcher2(query);
		assert.ok(m.matches({"a":5}));
	},

	"MixedNumericIN": function MixedNumericIN() {
		var query = {"a":{"$in":[4,6]}},
			m = new Matcher2(query);
		assert.ok(m.matches({"a":4.0}));
		assert.ok(!m.matches({"a":5.0}));
		assert.ok(m.matches({"a":4}));
	},

	"MixedNumericEmbedded": function MixedNumericEmbedded() {
		var query = {"a":{"x":1}},
			m = new Matcher2(query);
		assert.ok(m.matches({"a":{"x":1}}));
		assert.ok(m.matches({"a":{"x":1.0}}));
	},

	"Size": function Size() {
		var query = {"a":{"$size":4}},
			m = new Matcher2(query);
		assert.ok(m.matches({"a":[1,2,3,4]}));
		assert.ok(!m.matches({"a":[1,2,3]}));
		assert.ok(!m.matches({"a":[1,2,3,"a","b"]}));
		assert.ok(!m.matches({"a":[[1,2,3,4]]}));
	},

	"WithinBox - mongo Geo function, not porting": function WithinBox() {},

	"WithinPolygon - mongo Geo function, not porting": function WithinPolygon() {},

	"WithinCenter - mongo Geo function, not porting": function WithinCenter() {},

	"ElemMatchKey": function ElemMatchKey() {
		var query = {"a.b":1},
			m = new Matcher2(query),
			md = new MatchDetails();
		md.requestElemMatchKey();
		assert.ok(!md.hasElemMatchKey());
		assert.ok(m.matches({"a":[{"b":1}]}, md));
		assert.ok(md.hasElemMatchKey());
		assert.equal("0", md.elemMatchKey());
	},

	"WhereSimple1 - mongo MapReduce function, not available ": function WhereSimple1() {
	},

	"AllTiming - mongo benchmarking function, not available": function AllTiming() {
	},

};
