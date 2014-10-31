"use strict";
var assert = require("assert"),
	MapExpression = require("../../../../lib/pipeline/expressions/MapExpression"),
	DepsTracker = require("../../../../lib/pipeline/DepsTracker"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

// Mocha one-liner to make these tests self-hosted
if (!module.parent)return(require.cache[__filename] = null, (new (require("mocha"))({ui: "exports", reporter: "spec", grep: process.env.TEST_GREP})).addFile(__filename).run(process.exit));

module.exports = {

	"MapExpression": {

		"constructor()": {

			"should accept 4 arguments": function () {
				new MapExpression(1, 2, 3, 4);
			},

			"should not accept less than 4 arguments": function () {
				assert.throws(function () { new MapExpression(); });
				assert.throws(function () { new MapExpression(1); });
				assert.throws(function () { new MapExpression(1, 2); });
				assert.throws(function () { new MapExpression(1, 2, 3); });
			},
		},

		"optimize": {
			"trivial case": function() {
				var m = new MapExpression("test", "varname", new Expression(), new Expression());
				assert.ok(m.optimize());
			},
		},

		"addDependencies": {
			"trivial case - calls addDependencies on _input and _each": function () {}
		}
	}
};
