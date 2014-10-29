"use strict";
var assert = require("assert"),
	Document = require("../../../lib/pipeline/Document");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.Document = {

	"Json conversion": {

		"convert to Json": function toJson() {
			var aDocument = {"prop1":0},
				result = Document.toJson(aDocument);
			assert.equal(result, '{"prop1":0}');
		},

		"convert to Json with metadata": function toJsonWithMetaData() {
			var aDocument = {"prop1": 0,"metadata":"stuff"},
				result = Document.toJsonWithMetaData(aDocument);
			assert.equal(result, '{"prop1":0,"metadata":"stuff"}');
		},

		"convert from Json": function fromJsonWithMetaData() {
			var aDocumentString = '{\"prop1\":0,\"metadata\":1}',
				jsonDocument = {"prop1":0,"metadata":1},
				result = Document.fromJsonWithMetaData(aDocumentString);
			assert.deepEqual(result, jsonDocument);
		},

	},

	"compare 2 Documents": {

		"should return 0 if Documents are identical": function compareDocumentsIdentical() {
			var lDocument = {"prop1": 0},
				rDocument = {"prop1": 0},
				result = Document.compare(lDocument, rDocument);
			assert.equal(result, 0);
		},

		"should return -1 if left Document is shorter": function compareLeftDocumentShorter() {
			var lDocument = {"prop1": 0},
				rDocument = {"prop1": 0, "prop2": 0},
				result = Document.compare(lDocument, rDocument);
			assert.equal(result, -1);
		},

		"should return 1 if right Document is shorter": function compareRightDocumentShorter() {
			var lDocument = {"prop1": 0, "prop2": 0},
				rDocument = {"prop1": 0},
				result = Document.compare(lDocument, rDocument);
			assert.equal(result, 1);
		},

		"should return nameCmp result -1 if left Document field value is less": function compareLeftDocumentFieldLess() {
			var lDocument = {"prop1": 0},
				rDocument = {"prop1": 1},
				result = Document.compare(lDocument, rDocument);
			assert.equal(result, -1);
		},

		"should return nameCmp result 1 if right Document field value is less": function compareRightDocumentFieldLess() {
			var lDocument = {"prop1": 1},
				rDocument = {"prop1": 0},
				result = Document.compare(lDocument, rDocument);
			assert.equal(result, 1);
		},

	},

	"clone a Document": {

		"should return same field and value from cloned Document ": function clonedDocumentSingleFieldValue() {
			var doc = {"prop1": 17},
				res = Document.clone(doc);
			assert(res instanceof Object);
			assert.deepEqual(doc, res);
			assert.equal(res.prop1, 17);
		},

		"should return same fields and values from cloned Document ": function clonedDocumentMultiFieldValue() {
			var doc = {"prop1": 17, "prop2": "a string"},
				res = Document.clone(doc);
			assert.deepEqual(doc, res);
			assert(res instanceof Object);
			assert.equal(res.prop1, 17);
			assert.equal(res.prop2, "a string");
		},

	},

	"serialize and deserialize for sorter": {

		"should return a string": function serializeDocument() {
			var doc = {"prop1":1},
				res = Document.serializeForSorter(doc);
			assert.equal(res, "{\"prop1\":1}");
		},

		"should return a Document": function deserializeToDocument() {
			var str = "{\"prop1\":1}",
				doc = {"prop1":1},
				res = Document.deserializeForSorter(str);
			assert.deepEqual(res, doc);
		},

	},

};
