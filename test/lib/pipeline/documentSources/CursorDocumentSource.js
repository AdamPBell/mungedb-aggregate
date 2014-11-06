"use strict";
var assert = require("assert"),
	async = require("async"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	LimitDocumentSource = require("../../../../lib/pipeline/documentSources/LimitDocumentSource"),
	SkipDocumentSource = require("../../../../lib/pipeline/documentSources/SkipDocumentSource"),
	ProjectDocumentSource = require("../../../../lib/pipeline/documentSources/ProjectDocumentSource"),
	DepsTracker = require("../../../../lib/pipeline/DepsTracker"),
	ArrayRunner = require("../../../../lib/query/ArrayRunner");

var getCursorDocumentSource = function(values) {
	values = values || [1,2,3,4,5];
	return new CursorDocumentSource(null, new ArrayRunner(values), null);
};


module.exports = {

	"CursorDocumentSource": {

		"constructor(data)": {
			"should get a accept a CursorWithContext and set it internally": function(){
				var cds = getCursorDocumentSource([]);
				assert.ok(cds._runner);
			}
		},

		"#coalesce": {
			"should be able to coalesce a limit into itself": function (){
				var cds = getCursorDocumentSource(),
					lds = LimitDocumentSource.createFromJson(2);

				assert.equal(cds.coalesce(lds) instanceof LimitDocumentSource, true);
				assert.equal(cds.getLimit(), 2);
			},

			"should keep original limit if coalesced to a larger limit": function() {
				var cds = getCursorDocumentSource();
				cds.coalesce(LimitDocumentSource.createFromJson(2));
				cds.coalesce(LimitDocumentSource.createFromJson(3));
				assert.equal(cds.getLimit(), 2);
			},


			"cursor only returns $limit number when coalesced": function(next) {
				var cds = getCursorDocumentSource(),
					lds = LimitDocumentSource.createFromJson(2);


				cds.coalesce(lds);

				var docs = [], i = 0;
				async.doWhilst(
					function(cb) {
						cds.getNext(function(err, val) {
							docs[i] = val;
							return cb(err);
						});
					},
					function() {
						return docs[i++] !== null;
					},
					function(err) {
						if (err) throw err;
						assert.deepEqual([1, 2, null], docs);
						next();
					}
				);
			},

			"should leave non-limit alone": function () {
				var sds = new SkipDocumentSource(),
					cds = getCursorDocumentSource([]);

				assert.equal(cds.coalesce(sds), false);
			}
		},

		"#getNext": {
			"should return the current cursor value async": function(next){
				var expected = JSON.stringify([1,2]);

				var cds = getCursorDocumentSource([1,2,3,4]);
				async.series([
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
					],
					function(err,res) {
						assert.deepEqual([1,2,3,4,null], res);
						next();
					}
				);
			},
			"should return values past the batch limit": function(next){
				var n = 0,
					arr = Array.apply(0, new Array(200)).map(function() { return n++; });

				var cds = getCursorDocumentSource(arr);
				async.each(arr,
					function(a,next) {
						cds.getNext(function(err,val) {
							assert.equal(val,a);
							next(err);
						});
					},
					function(err) {
						assert.equal(err, null);
					}
				);
				cds.getNext(function(err,val) {
					assert.equal(val, null);
					next();
				});
			},
		},
		"#dispose": {
			"should empty the current cursor": function(next){
				var cds = getCursorDocumentSource();
				async.series([
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
						function(next){
							cds.dispose();
							return cds.getNext(next);
						}
					],
					function(err,res) {
						assert.deepEqual([1,2,null], res);
						next();
					}
				);
			}
		},

		"#setProjection": {

			"should set a projection": function(next) {
				var cds = getCursorDocumentSource([{a:1, b:2},{a:2, b:3}]),
					deps = new DepsTracker(),
					project = ProjectDocumentSource.createFromJson({"a":1});
				project.getDependencies(deps);
				cds.setProjection(deps.toProjection(), deps.toParsedDeps());
				
				async.series([
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
						cds.getNext.bind(cds)
					],
					function(err,res) {
						assert.deepEqual([{a:1},{a:2},null], res);
						next();
					}
				);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).grep(process.env.MOCHA_GREP || '').run(process.exit);
