"use strict";
var assert = require("assert"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource"),
	LimitDocumentSource = require("../../../../lib/pipeline/documentSources/LimitDocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	ArrayRunner = require("../../../../lib/query/ArrayRunner");

var addSource = function addSource(ds, data) {
	var cds = new CursorDocumentSource(null, new ArrayRunner(data), null);
	ds.setSource(cds);
};

module.exports = {

	"LimitDocumentSource": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(next){
				assert.doesNotThrow(function(){
					new LimitDocumentSource();
					return next();
				});
			}
		},

 		/** A limit does not introduce any dependencies. */
		"#getDependencies": {
			"limits do not create dependencies": function(next) {
				var lds = LimitDocumentSource.createFromJson(1, null),
					deps = {};

				assert.equal(DocumentSource.GetDepsReturn.SEE_NEXT, lds.getDependencies(deps));
				assert.equal(0, Object.keys(deps).length);
				return next();
			}
		},

		"#getSourceName()": {

			"should return the correct source name; $limit": function testSourceName(next){
				var lds = new LimitDocumentSource();
				assert.strictEqual(lds.getSourceName(), "$limit");
				return next();
			}
		},

		"#getFactory()": {

			"should return the constructor for this class": function factoryIsConstructor(next){
				assert.strictEqual(new LimitDocumentSource().getFactory(), LimitDocumentSource);
				return next();
			}
		},

		"#coalesce()": {

			"should return false if nextSource is not $limit": function dontSkip(next){
				var lds = new LimitDocumentSource();
				assert.equal(lds.coalesce({}), false);
				return next();
			},
			"should return true if nextSource is $limit": function changeLimit(next){
				var lds = new LimitDocumentSource();
				assert.equal(lds.coalesce(new LimitDocumentSource()), true);
				return next();
			}
		},

		"#getNext()": {

			"should throw an error if no callback is given": function(next) {
				var lds = new LimitDocumentSource();
				assert.throws(lds.getNext.bind(lds));
				return next();
			},

			/** Exhausting a DocumentSourceLimit disposes of the limit's source. */
			"should return the current document source": function currSource(next){
				var lds = new LimitDocumentSource({"$limit":[{"a":1},{"a":2}]});
				lds.limit = 1;
				addSource(lds, [{item:1}]);
				lds.getNext(function(err,val) {
					assert.deepEqual(val, { item:1 });
					return next();
				});
			},

			/** Exhausting a DocumentSourceLimit disposes of the pipeline's DocumentSourceCursor. */
			"should return EOF for no sources remaining": function noMoar(next){
				var lds = new LimitDocumentSource({"$match":[{"a":1},{"a":1}]});
				lds.limit = 1;
				addSource(lds, [{item:1}]);
				lds.getNext(function(){});
				lds.getNext(function(err,val) {
					assert.strictEqual(val, null);
					return next();
				});
			},

			"should return EOF if we hit our limit": function noMoar(next){
				var lds = new LimitDocumentSource();
				lds.limit = 1;
				addSource(lds, [{item:1},{item:2}]);
				lds.getNext(function(){});
				lds.getNext(function (err,val) {
					assert.strictEqual(val, null);
					return next();
				});
			}
		},

		"#serialize()": {

			"should create an object with a key $limit and the value equal to the limit": function sourceToJsonTest(next){
				var lds = new LimitDocumentSource();
				lds.limit = 9;
				var actual = lds.serialize(false);
				assert.deepEqual(actual, { "$limit": 9 });
				return next();
			}
		},

		"#createFromJson()": {

			"should return a new LimitDocumentSource object from an input number": function createTest(next){
				var t = LimitDocumentSource.createFromJson(5);
				assert.strictEqual(t.constructor, LimitDocumentSource);
				assert.strictEqual(t.limit, 5);
				return next();
			}
		}
	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
