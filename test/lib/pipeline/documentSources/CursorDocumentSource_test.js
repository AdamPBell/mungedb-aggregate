"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	async = require("async"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	LimitDocumentSource = require("../../../../lib/pipeline/documentSources/LimitDocumentSource"),
	SkipDocumentSource = require("../../../../lib/pipeline/documentSources/SkipDocumentSource"),
	ProjectDocumentSource = require("../../../../lib/pipeline/documentSources/ProjectDocumentSource"),
	DepsTracker = require("../../../../lib/pipeline/DepsTracker"),
	ArrayRunner = require("../../../../lib/query/ArrayRunner");


var createSource = function(values) {
	values = values || [1,2,3,4,5];
	return new CursorDocumentSource(null, new ArrayRunner(values), null);
};

//TODO: port their tests and test classes or document why we chose not to

exports.CursorDocumentSource = {

	"constructor(data)": {

		"should get a accept a CursorWithContext and set it internally": function() {
			var cds = createSource([]);
			assert(cds._runner instanceof ArrayRunner);
		},

	},

	"#coalesce": {

		"should be able to coalesce a limit into itself": function() {
			var cds = createSource(),
				lds = LimitDocumentSource.createFromJson(2);
			cds.coalesce(lds);
			assert.strictEqual(cds.getLimit(), 2);
		},

		"should keep original limit if coalesced to a larger limit": function() {
			var cds = createSource();
			cds.coalesce(LimitDocumentSource.createFromJson(2));
			cds.coalesce(LimitDocumentSource.createFromJson(3));
			assert.strictEqual(cds.getLimit(), 2);
		},

		"cursor only returns $limit number when coalesced": function(done) {
			var cds = createSource(),
				lds = LimitDocumentSource.createFromJson(2);

			cds.coalesce(lds);

			var docs = [],
				i = 0;
			async.doWhilst(
				function iterator(cb) {
					cds.getNext(function(err, val) {
						docs[i] = val;
						return cb(err);
					});
				},
				function test() {
					return docs[i++] !== null;
				},
				function(err) {
					assert.ifError(err);
					assert.deepEqual([1, 2, null], docs);
					return done();
				}
			);
		},

		"should leave non-limit alone": function() {
			var sds = new SkipDocumentSource(),
				cds = createSource([]);

			assert.strictEqual(cds.coalesce(sds), false);
		},

	},

	"#getNext": {

		"should return the current cursor value async": function(done) {
			var cds = createSource([1,2,3,4]);
			async.series(
				[
					cds.getNext.bind(cds),
					cds.getNext.bind(cds),
					cds.getNext.bind(cds),
					cds.getNext.bind(cds),
					cds.getNext.bind(cds),
				],
				function(err, res) {
					assert.ifError(err);
					assert.deepEqual([1,2,3,4,null], res);
					return done();
				}
			);
		},

		"should return values past the batch limit": function(done) {
			var arr = Array.apply(0, new Array(100000)).map(function(v, i) { return i; }),
				cds = createSource(arr),
				docs = [],
				doc;
			async.doWhilst(
				function iterator(next) {
					return cds.getNext(function(err, obj) {
						if (err) return next(err);
						doc = obj;
						if (doc !== null) docs.push(doc);
						return next();
					});
				},
				function test() {
					return doc !== null;
				},
				function after(err) {
					assert.ifError(err);
					assert.deepEqual(arr, docs);
					return done();
				}
			);
		},

	},

	"#dispose": {

		"should empty the current cursor": function(done) {
			var cds = createSource();
			async.series(
				[
					cds.getNext.bind(cds),
					cds.getNext.bind(cds),
					function(next) {
						cds.dispose();
						return cds.getNext(next);
					}
				],
				function(err, res) {
					assert.ifError(err);
					assert.deepEqual([1,2,null], res);
					return done();
				}
			);
		},

	},

	"#setProjection": {

		"should set a projection": function(done) {
			var cds = createSource([{a:1, b:2},{a:2, b:3}]),
				deps = new DepsTracker(),
				project = ProjectDocumentSource.createFromJson({"a":1});
			project.getDependencies(deps);
			cds.setProjection(deps.toProjection(), deps.toParsedDeps());

			async.series(
				[
					cds.getNext.bind(cds),
					cds.getNext.bind(cds),
					cds.getNext.bind(cds)
				],
				function(err, res) {
					assert.ifError(err);
					assert.deepEqual([{a:1},{a:2},null], res);
					return done();
				}
			);
		},

	},

};
