"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ErrorCodes = require("../../../../lib/Errors").ErrorCodes,
	TextMatchExpression = require("../../../../lib/pipeline/matcher/TextMatchExpression");

module.exports = {
	"TextMatchExpression": {
		"Should match an element, regardless of what is provided.": function() {
			var text = new TextMatchExpression(),
				text2 = new TextMatchExpression();

			assert.strictEqual(text.init("query", "language").code, ErrorCodes.OK);
			assert.strictEqual(text2.init("query2", "language2").code, ErrorCodes.OK);

			assert.ok(text.matchesSingleElement(text2)); // It"ll always work. Just the way it is in source.
		},

		"Should return the query provided in the init.": function() {
			var text = new TextMatchExpression();

			text.init("query", "language");

			assert.strictEqual(text.getQuery(), "query");
		},

		"Should return the language provided in the init.": function() {
			var text = new TextMatchExpression();

			text.init("query", "language");

			assert.strictEqual(text.getLanguage(), "language");
		},

		"Should return equivalency.": function() {
			var text1 = new TextMatchExpression(),
				text2 = new TextMatchExpression(),
				text3 = new TextMatchExpression();

			text1.init("query", "language");
			text2.init("query", "language");
			text3.init("query2", "language2");

			assert.ok(text1.equivalent(text1));
			assert.ok(text1.equivalent(text2));
			assert.ok(!text1.equivalent(text3));
		},

		"Should return a shallow copy of the original text match expression.": function() {
			var text1 = new TextMatchExpression();
			text1.init("query", "language");
			var text2 = text1.shallowClone();

			assert.ok(text1.equivalent(text2));
		}
	}
};
