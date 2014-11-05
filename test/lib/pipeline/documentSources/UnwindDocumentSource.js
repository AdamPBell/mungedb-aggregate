"use strict";
var assert = require("assert"),
	async = require("async"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource"),
	UnwindDocumentSource = require("../../../../lib/pipeline/documentSources/UnwindDocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	ArrayRunner = require("../../../../lib/query/ArrayRunner");


//HELPERS
var assertExhausted = function assertExhausted(pds) {
	assert.ok(pds.eof());
	assert.ok(!pds.advance());
};

/**
 * Tests if the given rep is the same as what the pds resolves to as JSON.
 * MUST CALL WITH A PDS AS THIS (e.g. checkJsonRepresentation.call(this, rep) where this is a PDS)
 **/
var checkJsonRepresentation = function checkJsonRepresentation(self, rep) {
	var pdsRep = self.serialize(true);
	assert.deepEqual(pdsRep, rep);
};

var createUnwind = function createUnwind(unwind) {
	//let unwind be optional
	if (!unwind) {
		unwind = "$a";
	}
	var spec = {$unwind: unwind},
		specElement = unwind,
		unwindDs = UnwindDocumentSource.createFromJson(specElement);
	checkJsonRepresentation(unwindDs, spec);
	return unwindDs;
};

var addSource = function addSource(unwind, data) {
	var cds = new CursorDocumentSource(null, new ArrayRunner(data), null);
	unwind.setSource(cds);
};

var checkResults = function checkResults(data, expectedResults, path, next) {
	if (expectedResults instanceof Function)
		next = expectedResults, expectedResults = null, path = null;
	if (path instanceof Function)
		next = path, path = null;

	var unwind = createUnwind(path);
	addSource(unwind, data || []);

	expectedResults = expectedResults || [];

	expectedResults.push(null);

	//Load the results from the DocumentSourceUnwind
	var docs = [], i = 0;
	async.doWhilst(
		function(cb) {
			unwind.getNext(function(err, val) {
				docs[i] = val;
				return cb(err);
			});
		},
		function() {
			return docs[i++] !== null;
		},
		function(err) {
			assert.deepEqual(expectedResults, docs);
			next();
		}
	);
};

var throwsException = function throwsException(data, path, expectedResults) {
	assert.throws(function () {
		checkResults(data, path, expectedResults);
	});
};


//TESTS
module.exports = {

	"UnwindDocumentSource": {

		"constructor()": {

			"should not throw Error when constructing without args": function (){
				assert.doesNotThrow(function(){
					new UnwindDocumentSource();
				});
			}

		},

		"#getSourceName()": {

			"should return the correct source name; $unwind": function (){
				var pds = new UnwindDocumentSource();
				assert.strictEqual(pds.getSourceName(), "$unwind");
			}

		},

		"#getNext()": {

			"should return EOF if source is empty": function (next){
				var pds = createUnwind();
				addSource(pds, []);
				pds.getNext(function(err,doc) {
					assert.strictEqual(doc, null);
					next();
				});
			},

			"should return document if source documents exist": function (next){
				var pds = createUnwind();
				addSource(pds, [{_id:0, a:[1]}]);
				pds.getNext(function(err,doc) {
					assert.notStrictEqual(doc, null);
					next();
				});
			},

			"should return document if source documents exist and advance the source": function (next){
				var pds = createUnwind();
				addSource(pds, [{_id:0, a:[1,2]}]);
				pds.getNext(function(err,doc) {
					assert.notStrictEqual(doc, null);
					assert.strictEqual(doc.a, 1);
					pds.getNext(function(err,doc) {
						assert.strictEqual(doc.a, 2);
						next();
					});
				});
			},

			"should return unwound documents": function (next){
				var pds = createUnwind();
				addSource(pds, [{_id:0, a:[1,2]}]);

				var docs = [], i = 0;
				async.doWhilst(
					function(cb) {
						pds.getNext(function(err, val) {
							docs[i] = val;
							return cb(err);
						});
					},
					function() {
						return docs[i++] !== null;
					},
					function(err) {
						assert.deepEqual([{_id:0, a:1},{_id:0, a:2},null], docs);
						next();
					}
				);
			},

			"A document without the unwind field produces no results.": function (next){
				checkResults([{}],next);
			},

			"A document with a null field produces no results.": function (next){
				checkResults([{a:null}],next);
			},

			"A document with an empty array produces no results.": function (next){
				checkResults([{a:[]}],next);
			},

			"A document with a number field produces a UserException.": function (next){
				throwsException([{a:1}],next);
				next();
			},

			"An additional document with a number field produces a UserException.": function (next){
				throwsException([{a:[1]}, {a:1}],next);
				next();
			},

			"A document with a string field produces a UserException.": function (next){
				throwsException([{a:"foo"}],next);
				next();
			},

			"A document with an object field produces a UserException.": function (next){
				throwsException([{a:{}}],next);
				next();
			},

			"Unwind an array with one value.": function (next){
				checkResults(
					[{_id:0, a:[1]}],
					[{_id:0,a:1}],
					next
				);
			},

			"Unwind an array with two values.": function (next){
				checkResults(
					[{_id:0, a:[1, 2]}],
					[{_id:0,a:1}, {_id:0,a:2}],
					next
				);
			},

			"Unwind an array with two values, one of which is null.": function (next){
				checkResults(
					[{_id:0, a:[1, null]}],
					[{_id:0,a:1}, {_id:0,a:null}],
					next
				);
			},

			"Unwind two documents with arrays.": function (next){
				checkResults(
					[{_id:0, a:[1,2]}, {_id:0, a:[3,4]}],
					[{_id:0,a:1}, {_id:0,a:2}, {_id:0,a:3}, {_id:0,a:4}],
					next
				);
			},

			"Unwind an array in a nested document.": function (next){
				checkResults(
					[{_id:0,a:{b:[1,2],c:3}}],
					[{_id:0,a:{b:1,c:3}},{_id:0,a:{b:2,c:3}}],
					"$a.b",
					next
				);
			},

			"A missing array (that cannot be nested below a non object field) produces no results.": function (next){
				checkResults(
					[{_id:0,a:4}],
					[],
					"$a.b",
					next
				);
			},

			"Unwind an array in a doubly nested document.": function (next){
				checkResults(
					[{_id:0,a:{b:{d:[1,2],e:4},c:3}}],
					[{_id:0,a:{b:{d:1,e:4},c:3}},{_id:0,a:{b:{d:2,e:4},c:3}}],
					"$a.b.d",
					next
				);
			},

			"Unwind several documents in a row.": function (next){
				checkResults(
					[
						{_id:0,a:[1,2,3]},
						{_id:1},
						{_id:2},
						{_id:3,a:[10,20]},
						{_id:4,a:[30]}
					],
					[
						{_id:0,a:1},
						{_id:0,a:2},
						{_id:0,a:3},
						{_id:3,a:10},
						{_id:3,a:20},
						{_id:4,a:30}
					],
					next
				);
			},

			"Unwind several more documents in a row.": function (next){
				checkResults(
					[
						{_id:0,a:null},
						{_id:1},
						{_id:2,a:['a','b']},
						{_id:3},
						{_id:4,a:[1,2,3]},
						{_id:5,a:[4,5,6]},
						{_id:6,a:[7,8,9]},
						{_id:7,a:[]}
					],
					[
						{_id:2,a:'a'},
						{_id:2,a:'b'},
						{_id:4,a:1},
						{_id:4,a:2},
						{_id:4,a:3},
						{_id:5,a:4},
						{_id:5,a:5},
						{_id:5,a:6},
						{_id:6,a:7},
						{_id:6,a:8},
						{_id:6,a:9}
					],
					next
				);
			}

		},

		"#createFromJson()": {

			"should error if called with non-string": function testNonObjectPassed() {
				//Date as arg
				assert.throws(function() {
					var pds = createUnwind(new Date());
				});
				//Array as arg
				assert.throws(function() {
					var pds = createUnwind([]);
				});
				//Empty args
				assert.throws(function() {
					var pds = UnwindDocumentSource.createFromJson();
				});
				//Top level operator
				assert.throws(function() {
					var pds = createUnwind({$add: []});
				});
			}

		},

		"#getDependencies": {

			"should get dependent field paths": function () {
				var pds = createUnwind("$x.y.z"),
					deps = {};
				assert.strictEqual(pds.getDependencies(deps), DocumentSource.GetDepsReturn.SEE_NEXT);
				assert.deepEqual(deps, {"x.y.z":1});
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).grep(process.env.MOCHA_GREP || '').run(process.exit);
