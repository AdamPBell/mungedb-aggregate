"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	FalseMatchExpression = require("../../../lib/matcher/FalseMatchExpression");


exports.FalseMatchExpression = {

	"Constructor": function Constructor() {
		var e = new FalseMatchExpression();
		assert.equal(e._matchType, "ALWAYS_FALSE");
	},

	"DebugString": function DebugString() {
		var e = new FalseMatchExpression();
		assert.equal(e.debugString(0), "$false\n");
	},

	"Equivalent": function Equivalent() {
		var a = new FalseMatchExpression(),
			b = new FalseMatchExpression();
		assert.equal(a.equivalent(b), true);
	},

	"Matches": function Matches() {
		var e = new FalseMatchExpression();
		assert.equal(e.matches({},{}), false);
	},

	"MatchesSingleElement": function MatchesSingleElement() {
		var e = new FalseMatchExpression();
		assert.equal(e.matchesSingleElement({}), false);
	},

	"ShallowClone": function ShallowClone() {
		var e = new FalseMatchExpression();
		assert.deepEqual(e.shallowClone(), new FalseMatchExpression());
	},

	"toJson": function toJson() {
		var e = new FalseMatchExpression(),
			obj = {};
		assert.deepEqual(e.toJson(obj), {"$false":1});
	},

};
