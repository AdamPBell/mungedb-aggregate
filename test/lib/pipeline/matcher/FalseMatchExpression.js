"use strict";
var assert = require("assert"),
	FalseMatchExpression = require("../../../../lib/pipeline/matcher/FalseMatchExpression");


module.exports = {
	"FalseMatchExpression": {

		"Constructor": function (){
			var e = new FalseMatchExpression();
			assert.equal(e._matchType, "ALWAYS_FALSE");
		},

		"DebugString": function () {
			var e = new FalseMatchExpression();
			assert.equal(e.debugString(0), "$false\n");
		},

		"Equivalent": function () {
			var a = new FalseMatchExpression(),
				b = new FalseMatchExpression();
			assert.equal(a.equivalent(b), true);
		},

		"Matches": function () {
			var e = new FalseMatchExpression();
			assert.equal(e.matches({},{}), false);
		},

		"MatchesSingleElement": function () {
			var e = new FalseMatchExpression();
			assert.equal(e.matchesSingleElement({}), false);
		},

		"ShallowClone": function () {
			var e = new FalseMatchExpression();
			assert.deepEqual(e.shallowClone(), new FalseMatchExpression());
		},

		"toJson": function () {
			var e = new FalseMatchExpression(),
				obj = {};
			assert.deepEqual(e.toJson(obj), {"$false":1});
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

