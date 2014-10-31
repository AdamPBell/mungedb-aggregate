"use strict"

var assert = require("assert"),
	Matcher2 = require("../../../../lib/pipeline/matcher/Matcher2.js");

module.exports = {
	"Matcher2": {
		"Constructor": function() {
			//var m = new Matcher2();
		},

		"Basic": function() {
			var json = {"a":"b"},
				m = new Matcher2(json);
			assert(m.matches(json));
		},

		"DoubleEqual": function() {
			var json = {"a":5},
				m = new Matcher2(json);
			assert(m.matches(json));
		},

		"MixedNumericEqual": function() {
			var query = {"a":5};
		},

		"MixedNumericGt": function() {
			var query =  {"a":{"$gt":4}};
		}
	}
}

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
