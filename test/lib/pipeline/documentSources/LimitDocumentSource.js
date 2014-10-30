"use strict";
var assert = require("assert"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource"),
	LimitDocumentSource = require("../../../../lib/pipeline/documentSources/LimitDocumentSource");


module.exports = {

	"LimitDocumentSource": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new LimitDocumentSource();
				});
			}

		},

		"#getDependencies": {
			"limits do not create dependencies": function() {
				var lds = LimitDocumentSource.createFromJson(1),
					deps = {};

				assert.equal(DocumentSource.GetDepsReturn.SEE_NEXT, lds.getDependencies(deps));
				assert.equal(0, Object.keys(deps).length);
			}
		},

		"#getSourceName()": {

			"should return the correct source name; $limit": function testSourceName(){
				var lds = new LimitDocumentSource();
				assert.strictEqual(lds.getSourceName(), "$limit");
			}

		},

		"#getFactory()": {

			"should return the constructor for this class": function factoryIsConstructor(){
				assert.strictEqual(new LimitDocumentSource().getFactory(), LimitDocumentSource);
			}

		},

		"#coalesce()": {

			"should return false if nextSource is not $limit": function dontSkip(){
				var lds = new LimitDocumentSource();
				assert.equal(lds.coalesce({}), false);
			},
			"should return true if nextSource is $limit": function changeLimit(){
				var lds = new LimitDocumentSource();
				assert.equal(lds.coalesce(new LimitDocumentSource()), true);
			}

		},

		"#getNext()": {

			"should throw an error if no callback is given": function() {
				var lds = new LimitDocumentSource();
				assert.throws(lds.getNext.bind(lds));
			},

			"should return the current document source": function currSource(next){
				var lds = new LimitDocumentSource();
				lds.limit = 1;
				lds.source = {getNext:function(cb){cb(null,{ item:1 });}};
				lds.getNext(function(err,val) {
					assert.deepEqual(val, { item:1 });
					next();
				});
			},

			"should return EOF for no sources remaining": function noMoar(next){
				var lds = new LimitDocumentSource();
				lds.limit = 10;
				lds.source = {
					calls: 0,
					getNext:function(cb) {
						if (lds.source.calls)
							return cb(null,DocumentSource.EOF);
						lds.source.calls++;
						return cb(null,{item:1});
					},
					dispose:function() { return true; }
				};
				lds.getNext(function(){});
				lds.getNext(function(err,val) {
					assert.strictEqual(val, DocumentSource.EOF);
					next();
				});
			},

			"should return EOF if we hit our limit": function noMoar(next){
				var lds = new LimitDocumentSource();
				lds.limit = 1;
				lds.source = {
					calls: 0,
					getNext:function(cb) {
						if (lds.source.calls)
							return cb(null,DocumentSource.EOF);
						return cb(null,{item:1});
					},
					dispose:function() { return true; }
				};
				lds.getNext(function(){});
				lds.getNext(function (err,val) {
					assert.strictEqual(val, DocumentSource.EOF);
					next();
				});
			}

		},

		"#serialize()": {

			"should create an object with a key $limit and the value equal to the limit": function sourceToJsonTest(){
				var lds = new LimitDocumentSource();
				lds.limit = 9;
				var actual = lds.serialize(false);
				assert.deepEqual(actual, { "$limit": 9 });
			}

		},

		"#createFromJson()": {

			"should return a new LimitDocumentSource object from an input number": function createTest(){
				var t = LimitDocumentSource.createFromJson(5);
				assert.strictEqual(t.constructor, LimitDocumentSource);
				assert.strictEqual(t.limit, 5);
			}

		}


	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
