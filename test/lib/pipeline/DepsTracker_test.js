"use strict";
var assert = require("assert"),
	DepsTracker = require("../../../lib/pipeline/DepsTracker");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.DepsTracker = {

	"#toProjection()": {

		"should be able to convert dependencies to a projection": function(){
			var deps = new DepsTracker(),
				expected = {_id:0,a:1,b:1};
			deps.fields = {a:1,b:1};
			assert.deepEqual(expected, deps.toProjection());
		},

		"should be able to convert dependencies with subfields to a projection": function(){
			var deps = new DepsTracker(),
				expected = {_id:0,a:1};
			deps.fields = {a:1,"a.b":1};
			assert.deepEqual(expected, deps.toProjection());
		},

		"should be able to convert dependencies with _id to a projection": function(){
			var deps = new DepsTracker(),
				expected = {a:1,b:1,_id:1};
			deps.fields = {_id:1,a:1,b:1};
			assert.deepEqual(expected, deps.toProjection());
		},

		"should be able to convert dependencies with id and subfields to a projection": function(){
			var deps = new DepsTracker(),
				expected = {_id:1,b:1};
			deps.fields = {"_id.a":1,b:1};
			assert.deepEqual(expected, deps.toProjection());
		},

		"should return empty object if needWholeDocument is true": function() {
			var deps = new DepsTracker(),
				expected = {};
			deps.needWholeDocument = true;
			assert.deepEqual(expected, deps.toProjection());
		},

		"should return $noFieldsNeeded if there are no dependencies": function() {
			var deps = new DepsTracker(),
				expected = {_id:0,$noFieldsNeeded:1};
			assert.deepEqual(expected, deps.toProjection());
		},

	},

	"#toParsedDeps()": {

		"should not parse if needWholeDocument is true": function() {
			var deps = new DepsTracker(),
				expected; // undefined;
			deps.needWholeDocument = true;
			assert.strictEqual(expected, deps.toParsedDeps());
		},

		"should not parse if needTextScore is true": function() {
			var deps = new DepsTracker(),
				expected; // undefined;
			deps.needTextScore = true;
			assert.strictEqual(expected, deps.toParsedDeps());
		},

		"should be able to parse dependencies": function() {
			var deps = new DepsTracker(),
				expected = {_fields:{a:true,b:true}};
			deps.fields = {a:1,b:1};
			assert.deepEqual(expected, deps.toParsedDeps());
		},

		"should be able to parse dependencies with subfields": function() {
			var deps = new DepsTracker(),
				expected = {_fields:{a:true}};
			deps.fields = {a:1,"a.b":1};
			assert.deepEqual(expected, deps.toParsedDeps());
		},

	},

};
