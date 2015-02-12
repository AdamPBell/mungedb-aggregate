"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	async = require("neo-async"),
	pipeline = require("../../../../lib/pipeline/"),
	DepsTracker = pipeline.DepsTracker,
	DocumentSource = pipeline.documentSources.DocumentSource,
	ProjectDocumentSource = pipeline.documentSources.ProjectDocumentSource,
	CursorDocumentSource = pipeline.documentSources.CursorDocumentSource,
	ArrayRunner = require("../../../../lib/query/ArrayRunner");


/**
 *   Tests if the given rep is the same as what the pds resolves to as JSON.
 *   MUST CALL WITH A PDS AS THIS (e.g. checkJsonRepresentation.call(this, rep) where this is a PDS)
 **/
function checkJsonRepresentation(self, rep) {
	var pdsRep = self.serialize();
	assert.deepEqual(pdsRep, rep);
}

function createProject(projection) {
	//let projection be optional
	if (!projection) {
		projection = {
			a: true
		};
	}
	var spec = {
			"$project": projection
		},
		specElement = projection,
		_project = ProjectDocumentSource.createFromJson(specElement);
	checkJsonRepresentation(_project, spec);
	return _project;
}

//TESTS
module.exports = {

	"constructor()": {

		"should not throw Error when constructing without args": function testConstructor() {
			assert.doesNotThrow(function() {
				new ProjectDocumentSource();
			});
		},

		"should throw Error when constructing with more than 1 arg": function testConstructor() {
			assert.throws(function() {
				new ProjectDocumentSource("a", "b", "c");
			});
		}

	},

	"#getSourceName()": {

		"should return the correct source name; $project": function testSourceName() {
			var pds = new ProjectDocumentSource();
			assert.strictEqual(pds.getSourceName(), "$project");
		}

	},

	"#getNext()": {

		"should return errors in the callback": function Errors() {
			var input = [{_id: 0, a: "foo"}];
			var cds = new CursorDocumentSource(null, new ArrayRunner(input), null);
			var pds = ProjectDocumentSource.createFromJson({x:{"$add":["$a", "$a"]}});
			pds.setSource(cds);
			pds.getNext(function(err, actual) {
				assert(err, "Expected error");
			});
		},

		"should return EOF": function testEOF(next) {
			var pds = createProject({});
			pds.setSource({
				getNext: function getNext(cb) {
					return cb(null, null);
				}
			});
			pds.getNext(function(err, doc) {
				assert.equal(null, doc);
				next();
			});
		},

		"iterator state accessors consistently report the source is exhausted": function assertExhausted() {
			var input = [{}];
			var cds = new CursorDocumentSource(null, new ArrayRunner(input), null);
			var pds = createProject();
			pds.setSource(cds);
			pds.getNext(function(err, actual) {
				pds.getNext(function(err, actual1) {
					assert.equal(null, actual1);
					pds.getNext(function(err, actual2) {
						assert.equal(null, actual2);
						pds.getNext(function(err, actual3) {
							assert.equal(null, actual3);
						});
					});
				});
			});
		},

		"callback is required": function requireCallback() {
			var pds = createProject();
			assert.throws(pds.getNext.bind(pds));
		},

		"should not return EOF when a document is still in cursor": function testNotEOFTrueIfDocPresent() {
			var input = [{_id: 0, a: 1}, {_id: 1, a: 2}];
			var cds = new CursorDocumentSource(null, new ArrayRunner(input), null);
			var pds = createProject();
			pds.setSource(cds);
			pds.getNext(function(err,actual) {
				// first go round
				assert.notEqual(actual, null);
			});
		},

		"can retrieve second document from source": function testAdvanceFirst() {
			var input = [{_id: 0, a: 1}, {_id: 1, a: 2}];
			var cds = new CursorDocumentSource(null, new ArrayRunner(input), null);
			var pds = createProject();
			pds.setSource(cds);

			pds.getNext(function(err,val) {
				// eh, ignored
				pds.getNext(function(err,val) {
					assert.equal(2, val.a);
				});
			});
		},

		"should get the first document out of a cursor": function getCurrentCalledFirst() {
			var input = [{_id: 0, a: 1}];
			var cds = new CursorDocumentSource(null, new ArrayRunner(input), null);
			var pds = createProject();
			pds.setSource(cds);
			pds.getNext(function(err, actual) {
				assert.equal(1, actual.a);
			});
		},

		"The a and c.d fields are included but the b field is not": function testFullProject1(next) {
			var input = [{
				_id:0,
				a: 1,
				b: 1,
				c: {
					d: 1
				}
			}];
			var cds = new CursorDocumentSource(null, new ArrayRunner(input), null);
			var pds = createProject({
					a: true,
					c: {
						d: true
					}
				}),
				expected = {_id: 0, a:1, c:{ d: 1 }};
			pds.setSource(cds);

			pds.getNext(function(err,val) {
				assert.deepEqual(expected, val);
				next();
			});
		},

		"Two documents": function testTwoDocumentsProject(next) {
			var input = [{
				a: 1,
				b: 2
			}, {
				a: 3,
				b: 4
			}],
			expected = [
				{a:1},
				{a:3},
				null
			];
			var cds = new CursorDocumentSource(null, new ArrayRunner(input), null);
			var pds = createProject({
				a: true,
				c: {
					d: true
				}
			});
			pds.setSource(cds);

			async.series([
					pds.getNext.bind(pds),
					pds.getNext.bind(pds),
					pds.getNext.bind(pds),
				],
				function(err,res) {
					assert.deepEqual(expected, res);
					next();
				}
			);
		}
	},

	"#optimize()": {

		"Optimize the projection": function optimizeProject() {
			var pds = createProject({
				a: {
					$and: [{$const:true}]
				}
			});

			pds.optimize();
			checkJsonRepresentation(pds, {$project:{a:{$const:true}}});
		}

	},

	"#createFromJson()": {

		"should error if called with non-object": function testNonObjectPassed() {
			//String as arg
			assert.throws(function() {
				createProject("not an object");
			});
			//Date as arg
			assert.throws(function() {
				createProject(new Date());
			});
			//Array as arg
			assert.throws(function() {
				createProject([]);
			});
			//Empty args
			assert.throws(function() {
				ProjectDocumentSource.createFromJson();
			});
			//Top level operator
			assert.throws(function() {
				createProject({
					$add: []
				});
			});
			//Invalid spec
			assert.throws(function() {
				createProject({
					a: {
						$invalidOperator: 1
					}
				});
			});

		}

	},

	"#getDependencies()": {

		"should properly detect dependencies in project": function testGetDependencies() {
			var input = {
				a: true,
				x: "$b",
				y: {
					$and: ["$c", "$d"]
				}
			};
			var pds = createProject(input);
			var dependencies = new DepsTracker();
			assert.equal(DocumentSource.GetDepsReturn.EXHAUSTIVE_FIELDS, pds.getDependencies(dependencies));
			assert.equal(5, Object.keys(dependencies.fields).length);
			assert.ok(dependencies.fields._id);
			assert.ok(dependencies.fields.a);
			assert.ok(dependencies.fields.b);
			assert.ok(dependencies.fields.c);
			assert.ok(dependencies.fields.d);
		}

	}

};
