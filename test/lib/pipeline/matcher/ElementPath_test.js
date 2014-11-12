"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ErrorCodes = require("../../../../lib/Errors").ErrorCodes,
	ElementPath = require("../../../../lib/pipeline/matcher/ElementPath.js");

module.exports = {
	"ElementPath": {

		"Should find the item at the path": function() {
			var p = new ElementPath(),
				doc = {"x":4, "a":5},
				matchItems = [5];

			assert.ok(p.init("a").code, ErrorCodes.OK);

			var checker = function(element) {
				assert.deepEqual(element, matchItems.shift());
			};
			p._matches(doc, null, checker);
		},

		"should find the array at a path": function()  {
			var p = new ElementPath(),
				doc = {"x":4, "a":[5, 6]},
				matchItems = [5,6, [5, 6]];

			assert.ok(p.init("a").code, ErrorCodes.OK);

			var checker = function(element) {
				assert.deepEqual(element, matchItems.shift());
			};
			p._matches(doc, null, checker);

		},

		"should find the array at a path without traversing the items in the array": function()  {
			var p = new ElementPath(),
				doc = {"x":4, "a":[5, 6]},
				matchItems = [[5, 6]];

			assert.ok(p.init("a").code, ErrorCodes.OK);
			p.setTraverseLeafArray(false);

			var checker = function(element) {
				assert.deepEqual(element, matchItems.shift());
			};
			p._matches(doc, null, checker);
		},

		"should walk nested arrays": function()  {
			var p = new ElementPath(),
				doc = {"a":[ {"b":5}, 3, {}, {"b":[9, 11]}, {"b":7}]},
				matchItems = [5, undefined, 9, 11, [9, 11], 7];

			assert.ok( p.init( "a.b" ).code, ErrorCodes.OK);

			var checker = function(element) {
				assert.deepEqual(element, matchItems.shift());
			};
			p._matches(doc, null, checker);
		},

		"should walk nested arrays but not the array leaves": function()  {
			var p = new ElementPath(),
				doc = {"a":[ {"b":5}, 3, {}, {"b":[9, 11]}, {"b":7}]},
				matchItems = [5, undefined, [9, 11], 7];

			assert.ok( p.init( "a.b" ).code, ErrorCodes.OK);
			p.setTraverseLeafArray( false );

			var checker = function(element) {
				assert.deepEqual(element, matchItems.shift());
			};
			p._matches(doc, null, checker);
		},

		"should follow array indicies": function()  {
			var p = new ElementPath(),
				doc = {"a":[5, 7, 3]},
				matchItems = [7];

			assert.ok( p.init( "a.1" ).code, ErrorCodes.OK);

			var checker = function(element) {
				assert.deepEqual(element, matchItems.shift());
			};
			p._matches(doc, null, checker);
		},

		"should follow array indicies and get the sub array without checking leaves": function()  {
			var p = new ElementPath(),
				doc = {"a":[5, [2, 4], 3]},
				matchItems = [[2,4]];

			assert.ok( p.init( "a.1" ).code, ErrorCodes.OK);

			var checker = function(element) {
				assert.deepEqual(element, matchItems.shift());
			};
			p._matches(doc, null, checker);
		},

		"should follow array indicies and then into objects for leaves": function()  {
			var p = new ElementPath(),
				doc = {"a":[5, {"1":4}, 3]},
				matchItems = [4, {"1":4}];

			assert.ok( p.init( "a.1" ).code, ErrorCodes.OK);

			var checker = function(element) {
				assert.deepEqual(element, matchItems.shift());
			};
			p._matches(doc, null, checker);
		},

		"should follow an array index and check the non existent leaves, then pull the rest of the path from the object": function()  {
			var p = new ElementPath(),
				doc = {"a":[5, {"b":4}, 3]},
				matchItems = [undefined, 4];

			assert.ok( p.init( "a.1.b" ).code, ErrorCodes.OK);

			var checker = function(element) {
				assert.deepEqual(element, matchItems.shift());
			};
			p._matches(doc, null, checker);
		},

		"should follow an array index into the leaves of a subarry, then get the remaining path inside the leaf object": function()  {
			var p = new ElementPath(),
				doc = {"a":[5, [{"b":4}], 3]},
				matchItems = [4];

			assert.ok( p.init( "a.1.b" ).code, ErrorCodes.OK);

			var checker = function(element) {
				assert.deepEqual(element, matchItems.shift());
			};
			p._matches(doc, null, checker);
		}
	}
};
