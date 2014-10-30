"use strict";
var assert = require("assert"),
	async = require("async"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	LimitDocumentSource = require("../../../../lib/pipeline/documentSources/LimitDocumentSource"),
	SkipDocumentSource = require("../../../../lib/pipeline/documentSources/SkipDocumentSource"),
	Cursor = require("../../../../lib/Cursor");

var getCursor = function(values) {
	if (!values)
		values = [1,2,3,4,5];
	var cwc = new CursorDocumentSource.CursorWithContext();
	cwc._cursor = new Cursor( values );
	return new CursorDocumentSource(cwc);
};


module.exports = {

	"CursorDocumentSource": {

		"constructor(data)": {
			"should fail if CursorWithContext is not provided": function(){
				assert.throws(function(){
					var cds = new CursorDocumentSource();
				});
			},
			"should get a accept a CursorWithContext and set it internally": function(){
				var cwc = new CursorDocumentSource.CursorWithContext();
				cwc._cursor = new Cursor( [] );

				var cds = new CursorDocumentSource(cwc);

				assert.ok(cds._cursorWithContext);
			}
		},

		"#coalesce": {
			"should be able to coalesce a limit into itself": function (){
				var cds = getCursor(),
					lds = LimitDocumentSource.createFromJson(2);

				assert.equal(cds.coalesce(lds) instanceof LimitDocumentSource, true);
				assert.equal(cds.getLimit(), 2);
			},

			"should keep original limit if coalesced to a larger limit": function() {
				var cds = getCursor();
				cds.coalesce(LimitDocumentSource.createFromJson(2));
				cds.coalesce(LimitDocumentSource.createFromJson(3));
				assert.equal(cds.getLimit(), 2);
			},


			"cursor only returns $limit number when coalesced": function(next) {
				var cds = getCursor(),
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
						return docs[i++] !== DocumentSource.EOF;
					},
					function(err) {
						assert.deepEqual([1, 2, DocumentSource.EOF], docs);
						next();
					}
				);
			},

			"should leave non-limit alone": function () {
				var cwc = new CursorDocumentSource.CursorWithContext();
				cwc._cursor = new Cursor( [] );

				var sds = new SkipDocumentSource(),
					cds = new CursorDocumentSource(cwc);

				assert.equal(cds.coalesce(sds), false);
			}
		},

		"#getNext": {
			"should throw an error if no callback is given": function() {
				var cwc = new CursorDocumentSource.CursorWithContext();
				cwc._cursor = new Cursor( [1,2,3,4] );
				var cds = new CursorDocumentSource(cwc);
				assert.throws(cds.getNext.bind(cds));
			},

			"should return the current cursor value async": function(next){
				var expected = JSON.stringify([1,2]);
				var cwc = new CursorDocumentSource.CursorWithContext();
				cwc._cursor = new Cursor( [1,2,3,4] );

				var cds = new CursorDocumentSource(cwc);
				async.series([
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
					],
					function(err,res) {
						assert.deepEqual([1,2,3,4,DocumentSource.EOF], res);
						next();
					}
				);
			},
			"should return values past the batch limit": function(next){
				var cwc = new CursorDocumentSource.CursorWithContext(),
					n = 0,
					arr = Array.apply(0, new Array(200)).map(function() { return n++; });
				cwc._cursor = new Cursor( arr );

				var cds = new CursorDocumentSource(cwc);
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
					assert.equal(val, DocumentSource.EOF);
					next();
				});
			},
		},
		"#dispose": {
			"should empty the current cursor": function(next){
				var cwc = new CursorDocumentSource.CursorWithContext();
				cwc._cursor = new Cursor( [1,2,3] );

				var cds = new CursorDocumentSource(cwc);
				async.series([
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
					],
					function(err,res) {
						assert.deepEqual([1,2,3,DocumentSource.EOF], res);
						next();
					}
				);
			}
		},

		"#setProjection": {

			"should set a projection": function() {
				var cwc = new CursorDocumentSource.CursorWithContext();
				cwc._cursor = new Cursor( [1,2,3] );

				var cds = new CursorDocumentSource(cwc);
				cds.setProjection({a:1}, {a:true});
				assert.deepEqual(cds._projection, {a:1});
				assert.deepEqual(cds._dependencies, {a:true});
			},

			"should throw an error if projection is already set": function (){
				var cwc = new CursorDocumentSource.CursorWithContext();
				cwc._cursor = new Cursor( [1,2,3] );

				var cds = new CursorDocumentSource(cwc);
				cds.setProjection({a:1}, {});
				assert.throws(function() {
					cds.setProjection({a:1}, {});
				});
			},

			"should project properly": function(next) {
				var cwc = new CursorDocumentSource.CursorWithContext();
				cwc._cursor = new Cursor( [{a:1},{a:2,b:3},{c:4,d:5}] );

				var cds = new CursorDocumentSource(cwc);
				cds.setProjection({a:1}, {a:true});
				assert.deepEqual(cds._projection, {a:1});
				assert.deepEqual(cds._dependencies, {a:true});

				async.series([
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
					],
					function(err,res) {
						assert.deepEqual([{a:1},{a:2},{},DocumentSource.EOF], res);
						next();
					}
				);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run();
