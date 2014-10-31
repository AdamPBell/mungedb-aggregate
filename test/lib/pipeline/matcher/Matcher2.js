"use strict"

var assert = require("assert"),
	MatchDetails = require("../../../../lib/pipeline/matcher/MatchDetails.js"),
	Matcher2 = require("../../../../lib/pipeline/matcher/Matcher2.js");

module.exports = {
	"Matcher2": {
		"Constructor": function() {
			var m = new Matcher2({"a":1});
		},

		"Basic": function() {
			var query = {"a":"b"},
				m = new Matcher2(query);
			assert(m.matches(query));
		},

		"DoubleEqual": function() {
			var query = {"a":5},
				m = new Matcher2(query);
			assert(m.matches(query));
		},

		"MixedNumericEqual": function() {	//not sure if we need this.  Same as DoubleEqual in munge
			var query = {"a":5},
				m = new Matcher2(query);
			assert(m.matches(query));
		},

		"MixedNumericGt": function() {
			var query = {"a":{"$gt":4}},
				m = new Matcher2(query);
			assert.ok(m.matches({"a":5}));
		},

		"MixedNumericIN": function() {
			var query = {"a":{"$in":[4,6]}},
				m = new Matcher2(query);
			assert.ok(m.matches({"a":4.0}));
			assert.ok(!m.matches({"a":5.0}));
			assert.ok(m.matches({"a":4}));
		},

		"MixedNumericEmbedded": function() {
			var query = {"a":{"x":1}},
				m = new Matcher2(query);
			assert.ok(m.matches({"a":{"x":1}}));
			assert.ok(m.matches({"a":{"x":1.0}}));
		},

		"Size": function() {
			var query = {"a":{"$size":4}},
				m = new Matcher2(query);
			assert.ok(m.matches({"a":[1,2,3,4]}));
			assert.ok(!m.matches({"a":[1,2,3]}));
			assert.ok(!m.matches({"a":[1,2,3,'a','b']}));
			assert.ok(!m.matches({"a":[[1,2,3,4]]}));
		},

		"WithinBox - mongo Geo function, not porting": function() {},

		"WithinPolygon - mongo Geo function, not porting": function() {},

		"WithinCenter - mongo Geo function, not porting": function() {},

        "ElemMatchKey": function() {
        	var query = {"a.b":1},
        		m = new Matcher2(query),
        		md = new MatchDetails();
        	md.requestElemMatchKey();
        	assert.ok(!md.hasElemMatchKey());
        	assert.ok(m.matches({"a":[{"b":1}]}, md));
        	assert.ok(md.hasElemMatchKey());
        	assert.equal("0", md.elemMatchKey());
        },

        "WhereSimple1 - mongo MapReduce function, not available ": function() {
        },

        "AllTiming - mongo benchmarking function, not available": function() {
        }
	}
}

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
