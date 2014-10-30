"use strict";
var assert = require("assert"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource");


module.exports = {

	"DocumentSource": {

		"#depsToProjection()": {
			"should be able to convert dependencies to a projection": function(){
				var array = {'a':1,'b':1},
					expected = '{"_id":0,"a":1,"b":1}',
					proj = DocumentSource.depsToProjection(array);

				assert.equal(expected, JSON.stringify(proj));
			},
			"should be able to convert dependencies with subfields to a projection": function(){
				var array = {'a':1,'a.b':1},
					expected = '{"_id":0,"a":1}',
					proj = DocumentSource.depsToProjection(array);

				assert.equal(expected, JSON.stringify(proj));
			},
			"should be able to convert dependencies with _id to a projection": function(){
				var array = {"_id":1,'a':1,'b':1},
					expected = '{"a":1,"b":1,"_id":1}',
					proj = DocumentSource.depsToProjection(array);

				assert.equal(expected, JSON.stringify(proj));
			},
			"should be able to convert dependencies with id and subfields to a projection": function(){
				var array = {'_id.a':1,'b':1},
					expected = '{"_id":1,"b":1}',
					proj = DocumentSource.depsToProjection(array);

				assert.equal(expected, JSON.stringify(proj));
			},
		},

		"#documentFromJsonWithDeps()": {
			"should be able to convert a document to its projected form": function() {
				var deps = {'a': true, 'b': true},
					doc = {a:23, b:64, c:92};

				var proj = DocumentSource.documentFromJsonWithDeps(doc, deps);
				assert.deepEqual({a:23,b:64}, proj);
			}
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run();

