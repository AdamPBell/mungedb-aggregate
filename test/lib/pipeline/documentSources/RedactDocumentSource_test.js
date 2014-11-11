"use strict";
var assert = require("assert"),
	async = require("async"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource"),
	RedactDocumentSource = require("../../../../lib/pipeline/documentSources/RedactDocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	ArrayRunner = require("../../../../lib/query/ArrayRunner"),
	Expressions = require("../../../../lib/pipeline/expressions");

var exampleRedact = {$cond:{
	if:{$gt:[0,4]},
	then:"$$DESCEND",
	else:"$$PRUNE"
}};

var createCursorDocumentSource = function createCursorDocumentSource (input) {
	if (!input || input.constructor !== Array) throw new Error('invalid');
	return new CursorDocumentSource(null, new ArrayRunner(input), null);
};

var createRedactDocumentSource = function createRedactDocumentSource (src, expression) {
	var rds = RedactDocumentSource.createFromJson(expression);
	rds.setSource(src);
	return rds;
};

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
						return cb(null, null);
					}
				});
				rds.getNext(function(err, doc) {
					assert.equal(null, doc);
					next();
				});
			},
			"should return Error in callback": function testError(next) {
				var rds = RedactDocumentSource.createFromJson({$cond:{
					if:{$gt:[0,{$add:["$a", 3]}]},
					then:"$$DESCEND",
					else:"$$PRUNE"
				}});
				rds.setSource(createCursorDocumentSource([{a:"foo"}]));
				rds.getNext(function(err, doc) {
					assert(err, "Expected Error");
					next();
				});
			},

			"iterator state accessors consistently report the source is exhausted": function assertExhausted() {
				var input = [{}];
				var cds = createCursorDocumentSource(input);
				var rds = RedactDocumentSource.createFromJson(exampleRedact);
				rds.setSource(cds);
				rds.getNext(function(err, actual) {
					rds.getNext(function(err, actual1) {
						assert.equal(null, actual1);
						rds.getNext(function(err, actual2) {
							assert.equal(null, actual2);
							rds.getNext(function(err, actual3) {
								assert.equal(null, actual3);
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

		"#redact()": {

			"should redact subsection where tag does not match": function (done) {
				var cds = createCursorDocumentSource([{
					_id: 1,
					title: "123 Department Report",
					tags: ["G", "STLW"],
					year: 2014,
					subsections: [
						{
							subtitle: "Section 1: Overview",
							tags: ["SI", "G"],
							content: "Section 1: This is the content of section 1."
						},
						{
							subtitle: "Section 2: Analysis",
							tags: ["STLW"],
							content: "Section 2: This is the content of section 2."
						},
						{
							subtitle: "Section 3: Budgeting",
							tags: ["TK"],
							content: {
								text: "Section 3: This is the content of section3.",
								tags: ["HCS"]
							}
						}
					]
				}]);

				var expression = {$cond:{
					if:{$gt: [{$size: {$setIntersection: ["$tags", [ "STLW", "G" ]]}},0]},
					then:"$$DESCEND",
					else:"$$PRUNE"
				}};

				var rds = createRedactDocumentSource(cds, expression);

				var result = {
					"_id": 1,
					"title": "123 Department Report",
					"tags": ["G", "STLW"],
					"year": 2014,
					"subsections": [{
						"subtitle": "Section 1: Overview",
						"tags": ["SI", "G"],
						"content": "Section 1: This is the content of section 1."
					}, {
						"subtitle": "Section 2: Analysis",
						"tags": ["STLW"],
						"content": "Section 2: This is the content of section 2."
					}]
				};

				rds.getNext(function (err, actual) {
					assert.deepEqual(actual, result);
					done();
				});

			},

			"should redact an entire subsection based on a defined access level": function (done) {
				var cds = createCursorDocumentSource([{
					_id: 1,
					level: 1,
					acct_id: "xyz123",
					cc: {
						level: 5,
						type: "yy",
						exp_date: new Date("2015-11-01"),
						billing_addr: {
							level: 5,
							addr1: "123 ABC Street",
							city: "Some City"
						},
						shipping_addr: [
							{
								level: 3,
								addr1: "987 XYZ Ave",
								city: "Some City"
							},
							{
								level: 3,
								addr1: "PO Box 0123",
								city: "Some City"
							}
						]
					},
					status: "A"
				}]);

				var expression = {$cond:{
					if:{$eq:["$level",5]},
					then:"$$PRUNE",
					else:"$$DESCEND"
				}};

				var rds = createRedactDocumentSource(cds, expression);

				var result = {
					_id:1,
					level:1,
					acct_id:"xyz123",
					status:"A"
				};

				rds.getNext(function (err, actual) {
					assert.deepEqual(actual, result);
					done();
				});

			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).grep(process.env.MOCHA_GREP || '').run(process.exit);
