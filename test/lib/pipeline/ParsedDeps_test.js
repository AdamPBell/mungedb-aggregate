"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ParsedDeps = require("../../../lib/pipeline/ParsedDeps");

exports.ParsedDeps = {

	"#extractFields": {

		"should be able to convert a document to its projected form": function() {
			var deps = {a:true, b:true},
				doc = {a:23, b:64, c:92},
				proj = new ParsedDeps(deps).extractFields(doc),
				expected = {a:23,b:64};
			assert.deepEqual(proj, expected);
		},

		"should extract fields for nested objects": function() {
			var deps = {a:{b:true}},
				doc = {a:{b:[1,2,3]},ignoreThisOne:123},
				proj = new ParsedDeps(deps).extractFields(doc),
				expected = {a:{b:[1,2,3]}};
			assert.deepEqual(proj, expected);
		},

	},

	"#_documentHelper": {

		"should skip fields that are not needed": function() {
			var json = {"foo":"bar"},
				neededFields = {},
				parse = new ParsedDeps(),
				expected = {};
			assert.deepEqual(parse._documentHelper(json, neededFields), expected);
		},

		"should return values that are booleans": function() {
			var json = {"foo":"bar"},
				neededFields = {"foo":true},
				parse = new ParsedDeps(),
				expected = {"foo":"bar"};
			assert.deepEqual(parse._documentHelper(json, neededFields), expected);
		},

		"should call _arrayHelper on values that are arrays": function() {
			var json = {"foo":[{"bar":"baz"}], "a": "b"},
				neededFields = {"foo":true},
				parse = new ParsedDeps(),
				expected = {"foo":[{bar:"baz"}]};
			assert.deepEqual(parse._documentHelper(json, neededFields), expected);
		},

		"should recurse on values that are objects": function() {
			var json = {"foo":{"bar":"baz"}},
				neededFields = {"foo":true},
				parse = new ParsedDeps(),
				expected = {"foo":{"bar":"baz"}};
			assert.deepEqual(parse._documentHelper(json, neededFields), expected);
		},

	},

	"#_arrayHelper": {

		"should call _documentHelper on values that are objects": function() {
			var array = [{"foo":"bar"}],
				neededFields = {"foo":true},
				parse = new ParsedDeps(),
				expected = [{foo:"bar"}];
			assert.deepEqual(parse._arrayHelper(array, neededFields), expected);
		},

		"should recurse on values that are arrays": function() {
			var array = [[{"foo":"bar"}]],
				neededFields = {"foo":true},
				parse = new ParsedDeps(),
				expected = [[{"foo":"bar"}]];

			var actual = parse._arrayHelper(array, neededFields);
			assert.deepEqual(actual, expected);
		},

	},

};
