"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	async = require("neo-async"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource"),
	SortDocumentSource = require("../../../../lib/pipeline/documentSources/SortDocumentSource"),
	LimitDocumentSource = require("../../../../lib/pipeline/documentSources/LimitDocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	ArrayRunner = require("../../../../lib/query/ArrayRunner"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression");

function getCursorDocumentSource(values) {
	return new CursorDocumentSource(null, new ArrayRunner(values), null);
}

/// An assertion for `ObjectExpression` instances based on Mongo's `ExpectedResultBase` class
function assertExpectedResult(args) {
	{// check for required args
		if (args === undefined) throw new TypeError("missing arg: `args` is required");
		if (args.spec && args.throw === undefined) args.throw = true; // Assume that spec only tests expect an error to be thrown
		//if (args.spec === undefined) throw new Error("missing arg: `args.spec` is required");
		if (args.expected !== undefined && args.docs === undefined) throw new Error("must provide docs with expected value");
	}// check for required args

	// run implementation
	if(args.expected && args.docs){
		var sds = SortDocumentSource.createFromJson(args.spec),
			next,
			results = [],
			cds = new CursorDocumentSource(null, new ArrayRunner(args.docs), null);
		sds.setSource(cds);
		async.whilst(
			function() {
				return next !== null;
			},
			function(done) {
				sds.getNext(function(err, doc) {
					if(err) return done(err);
					next = doc;
					if(next === null) {
						return done();
					} else {
						results.push(next);
						return done();
					}
				});
			},
			function(err) {
				assert.equal(JSON.stringify(results), JSON.stringify(args.expected));
				if(args.done) {
					return args.done();
				}
			}
		);
	}else{
		if(args.throw) {
			assert.throws(function(){
				SortDocumentSource.createFromJson(args.spec);
			});
		} else {
			assert.doesNotThrow(function(){
				SortDocumentSource.createFromJson(args.spec);
			});
		}
	}
}

module.exports = {

	"SortDocumentSource": {

		"constructor()": {

			// $sort spec is not an object
			"should throw Error when constructing without args": function testConstructor(){
				assertExpectedResult({"throw":true});
			},

			// $sort spec is not an object
			"should throw Error when $sort spec is not an object": function testConstructor(){
				assertExpectedResult({spec:"Foo"});
			},

			// $sort spec is an empty object
			"should throw Error when $sort spec is an empty object": function testConstructor(){
				assertExpectedResult({spec:{}});
			},


			// $sort _id is specified as an invalid object expression
			"should throw error when _id is an invalid object expression": function testConstructor(){
				assertExpectedResult({
					spec:{_id:{$add:1, $and:1}},
				});
			},

		},

		"#getSourceName()": {

			"should return the correct source name; $sort": function testSourceName(){
				var sds = new SortDocumentSource();
				assert.strictEqual(sds.getSourceName(), "$sort");
			}

		},

		"#getFactory()": {

			"should return the constructor for this class": function factoryIsConstructor(){
				assert.strictEqual(new SortDocumentSource().getFactory(), SortDocumentSource);
			}

		},

		"#getNext()": {
			/** Assert that iterator state accessors consistently report the source is exhausted. */
			"should return EOF if there are no more sources": function noSources(next){
				var cds = getCursorDocumentSource([{"a": 1}]);
				var sds = SortDocumentSource.createFromJson({"sort":1});
				sds.setSource(cds);
				sds.getNext(function(err, val) {
					assert.deepEqual(val, {a:1});
					sds.getNext(function(err, val) {
						if (err) throw err;
						assert.equal(val, null);
						return next();
					});
				});

			},

			"should not return EOF if there are documents": function hitSort(next){
				var cds = getCursorDocumentSource([{a: 1}]);
				var sds = SortDocumentSource.createFromJson({"sort":1});
				sds.setSource(cds);
				async.series([
						cds.getNext.bind(cds),
					],
					function(err,res) {
						if (err) throw err;
						assert.notEqual(res, null);
						return next();
					}
				);
			},

			"should return the current document source": function currSource(next){
				var cds = getCursorDocumentSource([{a: 1}]);
				var sds = SortDocumentSource.createFromJson({"sort":1});
				sds.setSource(cds);
				async.series([
						cds.getNext.bind(cds),
					],
					function(err,res) {
						if (err) throw err;
						assert.deepEqual(res, [ { a: 1 } ]);
						return next();
					}
				);
			},

			"should return next document when moving to the next source sorted descending": function nextSource(next){
				var cds = getCursorDocumentSource([{a: 1}, {b:2}]);
				var sds = SortDocumentSource.createFromJson({"sort":1});
				sds.setSource(cds);
				async.series([
						cds.getNext.bind(cds),
					],
					function(err,res) {
						if (err) throw err;
						assert.deepEqual(res, [ { a: 1 } ]);
						return next();
					}
				);
			},

			"should return false for no sources remaining sorted descending": function noMoar(next){
				var cds = getCursorDocumentSource([{a: 1}, {b:2}]);
				var sds = SortDocumentSource.createFromJson({"sort":1});
				sds.setSource(cds);
				async.series([
						cds.getNext.bind(cds),
						cds.getNext.bind(cds),
					],
					function(err,res) {
						if (err) throw err;
						assert.deepEqual(res,  [ { a: 1 }, { b: 2 } ]);
						return next();
					}
				);
			}
		},

		"#serialize()": {

			"should throw an error when trying to serialize": function serialize() {
				var sds = new SortDocumentSource();
				assert.throws(sds.serialize.bind(sds));
			}
		},

		"#serializeToArray()": {

			/**
            * Check that the BSON representation generated by the souce matches the BSON it was
            * created with.
            */
            "should have equal json representation": function serializeToArrayCheck(next){
				var sds = SortDocumentSource.createFromJson({"sort":1}, {});
				var array = [];
				sds.serializeToArray(array, false);
				assert.deepEqual(array, [{"$sort":{"sort":1}}]);
				return next();
			},

			"should create an object representation of the SortDocumentSource": function serializeToArrayTest(next){
				var sds = new SortDocumentSource();
				var fieldPathVar;
				sds.vSortKey.push(new FieldPathExpression("b", fieldPathVar) );
				var array = [];
				sds.serializeToArray(array, false);
				assert.deepEqual(array, [{"$sort":{"":-1}}] );
				return next();
			}

		},

		"#createFromJson()": {

			"should return a new SortDocumentSource object from an input JSON object": function createTest(next){
				var sds = SortDocumentSource.createFromJson({a:1});
				assert.strictEqual(sds.constructor, SortDocumentSource);
				var t = [];
				sds.serializeToArray(t, false);
				assert.deepEqual(t, [{"$sort":{"a":1}}] );
				return next();
			},

			"should return a new SortDocumentSource object from an input JSON object with a descending field": function createTest(next){
				var sds = SortDocumentSource.createFromJson({a:-1});
				assert.strictEqual(sds.constructor, SortDocumentSource);
				var t = [];
				sds.serializeToArray(t, false);
				assert.deepEqual(t,  [{"$sort":{"a":-1}}]);
				return next();
			},

			"should return a new SortDocumentSource object from an input JSON object with dotted paths": function createTest(next){
				var sds = SortDocumentSource.createFromJson({ "a.b":1 });
				assert.strictEqual(sds.constructor, SortDocumentSource);
				var t = [];
				sds.serializeToArray(t, false);
				assert.deepEqual(t, [{"$sort":{"a.b":1}}]);
				return next();
			},

			"should throw an exception when not passed an object": function createTest(next){
				assert.throws(function() {
					SortDocumentSource.createFromJson(7);
				});
				return next();
			},

			"should throw an exception when passed an empty object": function createTest(next){
				assert.throws(function() {
					SortDocumentSource.createFromJson({});
				});
				return next();
			},

			"should throw an exception when passed an object with a non number value": function createTest(next){
				assert.throws(function() {
					SortDocumentSource.createFromJson({a:"b"});
				});
				return next();
			},

			"should throw an exception when passed an object with a non valid number value": function createTest(next){
				assert.throws(function() {
					SortDocumentSource.createFromJson({a:14});
				});
				next();
			}
		},

		"#sort": {

			"should sort a single document": function singleValue(next) {
				var cds = getCursorDocumentSource([{_id:0, a: 1}]);
				var sds = new SortDocumentSource();
				sds.addKey("_id", false);
				sds.setSource(cds);
				sds.getNext(function(err, actual) {
					if (err) throw err;
					assert.deepEqual(actual, {_id:0, a:1});
					return next();
				});
			},

			"should sort two documents": function twoValue(next) {
				var cds = getCursorDocumentSource([{_id:0, a: 1}, {_id:1, a:0}]);
				var sds = new SortDocumentSource();
				sds.addKey("_id", false);
				sds.setSource(cds);

				async.series([
						sds.getNext.bind(sds),
						sds.getNext.bind(sds),
					],
					function(err,res) {
						if (err) throw err;
						assert.deepEqual([ { _id: 1, a: 0 }, { _id: 0, a: 1 } ], res);
						return next();
					}
				);
			},

			"should sort two documents in ascending order": function ascendingValue(next) {
				var cds = getCursorDocumentSource([{_id:0, a: 1}, {_id:5, a:12}, {_id:1, a:0}]);
				var sds = new SortDocumentSource();
				sds.addKey("_id", true);
				sds.setSource(cds);

				var docs = [], i = 0;
				async.doWhilst(
					function(cb) {
						sds.getNext(function(err, val) {
							docs[i] = val;
							return cb(err);
						});
					},
					function() {
						return docs[i++] !== null;
					},
					function(err) {
						if (err) throw err;
						assert.deepEqual([{_id:0, a: 1}, {_id:1, a:0}, {_id:5, a:12}, null], docs);
						return next();
					}
				);
			},

			"should sort documents with a compound key": function compoundKeySort(next) {
				var cds = getCursorDocumentSource([{_id:0, a: 1, b:3}, {_id:5, a:12, b:7}, {_id:1, a:0, b:2}]);
				var sds = SortDocumentSource.createFromJson({"sort":1});

				sds.addKey("a", false);
				sds.addKey("b", false);
				sds.setSource(cds);

				var docs = [], i = 0;
				async.doWhilst(
					function(cb) {
						sds.getNext(function(err, val) {
							docs[i] = val;
							return cb(err);
						});
					},
					function() {
						return docs[i++] !== null;
					},
					function(err) {
						if (err) throw err;
						assert.deepEqual([{_id:5, a:12, b:7}, {_id:0, a:1, b:3}, {_id:1, a:0, b:2}, null], docs);
						return next();
					}
				);
			},

			"should sort documents with a compound key in ascending order": function compoundAscendingKeySort(next) {
				var cds = getCursorDocumentSource([{_id:0, a: 1, b:3}, {_id:5, a:12, b:7}, {_id:1, a:0, b:2}]);
				var sds = new SortDocumentSource();
				sds.addKey("a", true);
				sds.addKey("b", true);
				sds.setSource(cds);

				var docs = [], i = 0;
				async.doWhilst(
					function(cb) {
						sds.getNext(function(err, val) {
							docs[i] = val;
							return cb(err);
						});
					},
					function() {
						return docs[i++] !== null;
					},
					function(err) {
						if (err) throw err;
						assert.deepEqual([{_id:1, a:0, b:2}, {_id:0, a:1, b:3}, {_id:5, a:12, b:7}, null], docs);
						return next();
					}
				);
			},

			"should sort documents with a compound key in mixed order": function compoundMixedKeySort(next) {
				var cds = getCursorDocumentSource([{_id:0, a: 1, b:3}, {_id:5, a:12, b:7}, {_id:1, a:0, b:2}, {_id:8, a:7, b:42}]);
				var sds = new SortDocumentSource();
				sds.addKey("a", true);
				sds.addKey("b", false);
				sds.setSource(cds);

				var docs = [], i = 0;
				async.doWhilst(
					function(cb) {
						sds.getNext(function(err, val) {
							docs[i] = val;
							return cb(err);
						});
					},
					function() {
						return docs[i++] !== null;
					},
					function(err) {
						if (err) throw err;
						assert.deepEqual([{_id:1, a:0, b:2}, {_id:0, a:1, b:3}, {_id:8, a:7, b:42}, {_id:5, a:12, b:7}, null], docs);
						return next();
					}
				);
			},

			"should not sort different types": function diffTypesSort(next) {
				var cds = getCursorDocumentSource([{_id:0, a: 1}, {_id:1, a:"foo"}]);
				var sds = new SortDocumentSource();
				sds.addKey("a", false);
				assert.throws(sds.setSource(cds));
				return next();
			},

			"should sort docs with missing fields": function missingFields(next) {
				var cds = getCursorDocumentSource([{_id:0, a: 1}, {_id:1}]);
				var sds = new SortDocumentSource();
				sds.addKey("a", true);
				sds.setSource(cds);

				var docs = [], i = 0;
				async.doWhilst(
					function(cb) {
						sds.getNext(function(err, val) {
							docs[i] = val;
							return cb(err);
						});
					},
					function() {
						return docs[i++] !== null;
					},
					function(err) {
						if (err) throw err;
						assert.deepEqual([{_id:1}, {_id:0, a:1}, null], docs);
						return next();
					}
				);
			},

			"should sort docs with null fields": function nullFields(next) {
				var cds = getCursorDocumentSource([{_id:0, a: 1}, {_id:1, a: null}]);
				var sds = new SortDocumentSource();
				sds.addKey("a", true);
				sds.setSource(cds);

				var docs = [], i = 0;
				async.doWhilst(
					function(cb) {
						sds.getNext(function(err, val) {
							docs[i] = val;
							return cb(err);
						});
					},
					function() {
						return docs[i++] !== null;
					},
					function(err) {
						if (err) throw err;
						assert.deepEqual([{_id:1, a:null}, {_id:0, a:1}, null], docs);
						return next();
					}
				);
			},

			"should not support a missing object nested in an array": function missingObjectWithinArray(next) {
				var cds = getCursorDocumentSource([{_id:0, a: [1]}, {_id:1, a:[0]}]);
				var sds = new SortDocumentSource();
				assert.throws(function() {
					sds.addKey("a.b", false);
					sds.setSource(cds);
					var c = [];
					while (!sds.eof()) {
						c.push(sds.getCurrent());
						sds.advance();
					}
				});
				return next();
			},

			"should compare nested values from within an array": function extractArrayValues(next) {
				var cds = getCursorDocumentSource([{_id:0,a:[{b:1},{b:2}]}, {_id:1,a:[{b:1},{b:1}]}]);
				var sds = new SortDocumentSource();
				sds.addKey("a.b", true);
				sds.setSource(cds);

				var docs = [], i = 0;
				async.doWhilst(
					function(cb) {
						sds.getNext(function(err, val) {
							docs[i] = val;
							return cb(err);
						});
					},
					function() {
						return docs[i++] !== null;
					},
					function(err) {
						if (err) throw err;
						assert.deepEqual([{_id:1,a:[{b:1},{b:1}]},{_id:0,a:[{b:1},{b:2}]}, null], docs);
						return next();
					}
				);
			}
		},

		"#coalesce()": {
			"should return false when coalescing a non-limit source": function nonLimitSource(next) {
				var cds = getCursorDocumentSource([{_id:0,a:[{b:1},{b:2}]}, {_id:1,a:[{b:1},{b:1}]} ]);
				var	sds = SortDocumentSource.createFromJson({a:1});

				var newSrc = sds.coalesce(cds);
				assert.equal(newSrc, false);
				return next();
			},


			"should return limit source when coalescing a limit source": function limitSource(next) {
				var sds = SortDocumentSource.createFromJson({a:1});

				// TODO: add missing test cases.
				// array json getLimit
				// getShardSource
				// getMergeSource

				var newSrc = sds.coalesce(LimitDocumentSource.createFromJson(10));
				assert.ok(newSrc instanceof LimitDocumentSource);
				assert.equal(sds.getLimit(), 10);
				assert.equal(newSrc.limit, 10);

				sds.coalesce(LimitDocumentSource.createFromJson(5));
				assert.equal(sds.getLimit(), 5);

				var arr = [];
				sds.serializeToArray(arr);
				assert.deepEqual(arr, [{$sort: {a:1}}, {$limit: 5}]);

				// TODO: add missing test cases
				// doc array get limit
				// getShardSource
				// get MergeSource
				return next();
			},
		},

		"#dependencies": {
			/** Dependant field paths. */
			"should have Dependant field paths": function dependencies(next) {
			 	var sds = SortDocumentSource.createFromJson({sort: 1});

				sds.addKey("a", true);
			 	sds.addKey("b.c", false);

				var deps = {fields: {}, needWholeDocument: false, needTextScore: false};

				assert.equal(DocumentSource.GetDepsReturn.SEE_NEXT, sds.getDependencies(deps));
				// Sort keys are now part of deps fields.
				assert.equal(3, Object.keys(deps.fields).length);
			 	assert.equal(1, deps.fields.a);
				assert.equal(1, deps.fields["b.c"]);
				assert.equal(false, deps.needWholeDocument);
				assert.equal(false, deps.needTextScore);
				return next();
			}
		}
	}
};
