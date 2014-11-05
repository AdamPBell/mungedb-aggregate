"use strict";
var assert = require("assert"),
	ParsedDeps = require("../../../lib/pipeline/ParsedDeps");

module.exports = {
	"ParsedDeps": {
		"#extractFields": {
			"should be able to convert a document to its projected form": function() {
				var deps = {'a': true, 'b': true},
					doc = {a:23, b:64, c:92},
					parse = new ParsedDeps(deps);

				var proj = parse.extractFields(doc);
				assert.deepEqual({a:23,b:64}, proj);
			}
		},
		"#_documentHelper": {
			"should skip fields that are not needed": function() {
				var json = {'foo':'bar'},
					neededFields = {},
					parse = new ParsedDeps(),
					expected = {};
				assert.deepEqual(expected, parse._documentHelper(json, neededFields));
			},
			"should return values that are booleans": function() {
				var json = {'foo':'bar'},
					neededFields = {'foo':true},
					parse = new ParsedDeps(),
					expected = {'foo':'bar'};
				assert.deepEqual(expected, parse._documentHelper(json, neededFields));
			},
			"should call _arrayHelper on values that are arrays": function() {
				var json = {'foo':[{'bar':'baz'}], 'a': 'b'},
					neededFields = {'foo':true},
					parse = new ParsedDeps(),
					expected = {'foo':[{bar:'baz'}]};
				assert.deepEqual(expected, parse._documentHelper(json, neededFields));
			},
			"should recurse on values that are objects": function() {
				var json = {'foo':{'bar':'baz'}},
					neededFields = {'foo':true},
					parse = new ParsedDeps(),
					expected = {'foo':{'bar':'baz'}};
				assert.deepEqual(expected, parse._documentHelper(json, neededFields));
			}
		},
		"#_arrayHelper": {
			"should call _documentHelper on values that are objects": function() {
				var array = [{'foo':'bar'}],
					neededFields = {'foo':true},
					parse = new ParsedDeps(),
					expected = [{foo:'bar'}];
				assert.deepEqual(expected, parse._arrayHelper(array, neededFields));
			},
			"should recurse on values that are arrays": function() {
				var array = [[{'foo':'bar'}]],
					neededFields = {'foo':true},
					parse = new ParsedDeps(),
					expected = [[{'foo':'bar'}]];

				var actual = parse._arrayHelper(array, neededFields);
				assert.deepEqual(actual, expected);
			}
		}
	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run();
