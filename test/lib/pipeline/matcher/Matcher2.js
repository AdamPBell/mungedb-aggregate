"use strict"

var assert = require("assert"),
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
			assert.ok(m.matches({"a":5.0}));
			assert.ok(m.matches({"a":4}));
		}
	}
}

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
