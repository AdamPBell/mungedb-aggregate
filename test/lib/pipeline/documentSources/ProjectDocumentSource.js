"use strict";
var assert = require("assert"),
	async = require("async"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource"),
	ProjectDocumentSource = require("../../../../lib/pipeline/documentSources/ProjectDocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	Cursor = require("../../../../lib/Cursor");


/**
 *   Tests if the given rep is the same as what the pds resolves to as JSON.
 *   MUST CALL WITH A PDS AS THIS (e.g. checkJsonRepresentation.call(this, rep) where this is a PDS)
 **/
var checkJsonRepresentation = function checkJsonRepresentation(self, rep) {
	var pdsRep = {};
	self.sourceToJson(pdsRep, true);
	assert.deepEqual(pdsRep, rep);
};

var createProject = function createProject(projection) {
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
		project = ProjectDocumentSource.createFromJson(specElement);
	checkJsonRepresentation(project, spec);
	return project;
};

//TESTS
module.exports = {

	"ProjectDocumentSource": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor() {
				assert.doesNotThrow(function() {
					new ProjectDocumentSource();
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

			"should return EOF": function testEOF(next) {
				var pds = createProject();
				pds.setSource({
					getNext: function getNext(cb) {
						return cb(null, DocumentSource.EOF);
					}
				});
				pds.getNext(function(err, doc) {
					assert.equal(DocumentSource.EOF, doc);
					next();
				});
			},

			"iterator state accessors consistently report the source is exhausted": function assertExhausted() {
				var cwc = new CursorDocumentSource.CursorWithContext();
				var input = [{}];
				cwc._cursor = new Cursor( input );
				var cds = new CursorDocumentSource(cwc);
				var pds = createProject();
				pds.setSource(cds);
				pds.getNext(function(err, actual) {
					pds.getNext(function(err, actual1) {
						assert.equal(DocumentSource.EOF, actual1);
						pds.getNext(function(err, actual2) {
							assert.equal(DocumentSource.EOF, actual2);
							pds.getNext(function(err, actual3) {
								assert.equal(DocumentSource.EOF, actual3);
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
				var cwc = new CursorDocumentSource.CursorWithContext();
				var input = [{_id: 0, a: 1}, {_id: 1, a: 2}];
					cwc._cursor = new Cursor( input );
				var cds = new CursorDocumentSource(cwc);
				var pds = createProject();
				pds.setSource(cds);
				pds.getNext(function(err,actual) {
					// first go round
					assert.notEqual(actual, DocumentSource.EOF);
				});
			},

			"can retrieve second document from source": function testAdvanceFirst() {
				var cwc = new CursorDocumentSource.CursorWithContext();
				var input = [{_id: 0, a: 1}, {_id: 1, a: 2}];
				cwc._cursor = new Cursor( input );
				var cds = new CursorDocumentSource(cwc);
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
				var cwc = new CursorDocumentSource.CursorWithContext();
				var input = [{_id: 0, a: 1}];
				cwc._cursor = new Cursor( input );
				var cds = new CursorDocumentSource(cwc);
				var pds = createProject();
				pds.setSource(cds);
				pds.getNext(function(err, actual) {
					assert.equal(1, actual.a);
				});
			},

			"The a and c.d fields are included but the b field is not": function testFullProject1(next) {
				var cwc = new CursorDocumentSource.CursorWithContext();
				var input = [{
					_id: 0,
					a: 1,
					b: 1,
					c: {
						d: 1
					}
				}];
				cwc._cursor = new Cursor(input);
				var cds = new CursorDocumentSource(cwc);
				var pds = createProject({
						a: true,
						c: {
							d: true
						}
					}),
					expected = {a:1, c:{ d: 1 }};
				pds.setSource(cds);

				pds.getNext(function(err,val) {
					assert.deepEqual(expected, val);
					next();
				});
			},

			"Two documents": function testTwoDocumentsProject(next) {
				var cwc = new CursorDocumentSource.CursorWithContext();
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
					DocumentSource.EOF
				];
				cwc._cursor = new Cursor(input);
				var cds = new CursorDocumentSource(cwc);
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
						$and: [true]
					}
				});
				pds.optimize();
				checkJsonRepresentation(pds, {
					$project: {
						a: {
							$const: true
						}
					}
				});
			}

		},

		"#createFromJson()": {

			"should error if called with non-object": function testNonObjectPassed() {
				//String as arg
				assert.throws(function() {
					var pds = createProject("not an object");
				});
				//Date as arg
				assert.throws(function() {
					var pds = createProject(new Date());
				});
				//Array as arg
				assert.throws(function() {
					var pds = createProject([]);
				});
				//Empty args
				assert.throws(function() {
					var pds = ProjectDocumentSource.createFromJson();
				});
				//Top level operator
				assert.throws(function() {
					var pds = createProject({
						$add: []
					});
				});
				//Invalid spec
				assert.throws(function() {
					var pds = createProject({
						a: {
							$invalidOperator: 1
						}
					});
				});

			}

		},

		"#getDependencies()": {

			"should properly detect dependencies in project": function testGetDependencies() {
				var cwc = new CursorDocumentSource.CursorWithContext();
				var input = {
					a: true,
					x: '$b',
					y: {
						$and: ['$c', '$d']
					}
				};
				var pds = createProject(input);
				var dependencies = {};
				assert.equal(DocumentSource.GetDepsReturn.EXHAUSTIVE, pds.getDependencies(dependencies));
				assert.equal(5, Object.keys(dependencies).length);
				assert.ok(dependencies._id);
				assert.ok(dependencies.a);
				assert.ok(dependencies.b);
				assert.ok(dependencies.c);
				assert.ok(dependencies.d);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).grep(process.env.MOCHA_GREP || '').run(process.exit);
