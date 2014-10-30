"use strict";
var assert = require("assert"),
	async = require("async"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource"),
	RedactDocumentSource = require("../../../../lib/pipeline/documentSources/RedactDocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	Cursor = require("../../../../lib/Cursor");

var exampleRedact = {$cond: [
	{$gt:[3, 0]},
	"$$DESCEND",
	"$$PRUNE"]
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// BUSTED ////////////////////////////////////
//           This DocumentSource is busted without new Expressions            //
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//TESTS
module.exports = {

	"RedactDocumentSource": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor() {
				assert.doesNotThrow(function() {
					new RedactDocumentSource();
				});
			}

		},

		"#getSourceName()": {

			"should return the correct source name; $redact": function testSourceName() {
				var rds = new RedactDocumentSource();
				assert.strictEqual(rds.getSourceName(), "$redact");
			}

		},

		"#getNext()": {

			"should return EOF": function testEOF(next) {
				var rds = RedactDocumentSource.createFromJson(exampleRedact);
				rds.setSource({
					getNext: function getNext(cb) {
						return cb(null, DocumentSource.EOF);
					}
				});
				rds.getNext(function(err, doc) {
					assert.equal(DocumentSource.EOF, doc);
					next();
				});
			},

			"iterator state accessors consistently report the source is exhausted": function assertExhausted() {
				var cwc = new CursorDocumentSource.CursorWithContext();
				var input = [{}];
				cwc._cursor = new Cursor( input );
				var cds = new CursorDocumentSource(cwc);
				var rds = RedactDocumentSource.createFromJson(exampleRedact);
				rds.setSource(cds);
				rds.getNext(function(err, actual) {
					rds.getNext(function(err, actual1) {
						assert.equal(DocumentSource.EOF, actual1);
						rds.getNext(function(err, actual2) {
							assert.equal(DocumentSource.EOF, actual2);
							rds.getNext(function(err, actual3) {
								assert.equal(DocumentSource.EOF, actual3);
							});
						});
					});
				});
			},

			"callback is required": function requireCallback() {
				var rds = new RedactDocumentSource();
				assert.throws(rds.getNext.bind(rds));
			},
		},

		"#optimize()": {

			"Optimize the expression": function optimizeProject() {
				var rds = RedactDocumentSource.createFromJson(exampleRedact);
				assert.doesNotThrow(rds.optimize.bind(rds));
			}

		},

		"#createFromJson()": {

			"should error if called with non-object": function testNonObjectPassed() {
				//Empty args
				assert.throws(function() {
					var rds = RedactDocumentSource.createFromJson();
				});
				//Invalid spec
				assert.throws(function() {
					var rds = RedactDocumentSource.createFromJson({$invalidOperator: 1});
				});

			}

		},
	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).grep(process.env.MOCHA_GREP || '').run(process.exit);

