"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	async = require("async"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource"),
	SkipDocumentSource = require("../../../../lib/pipeline/documentSources/SkipDocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	ArrayRunner = require("../../../../lib/query/ArrayRunner");

function addSource(ds, data) {
	var cds = new CursorDocumentSource(null, new ArrayRunner(data), null);
	ds.setSource(cds);
}

module.exports = {

	"SkipDocumentSource": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new SkipDocumentSource();
				});
			}

		},

		"#create()": {
			"should create a direct copy of a SkipDocumentSource created through the constructor": function () { //TODO: fix this
				var sds1 = new SkipDocumentSource(),
					sds2 = SkipDocumentSource.create();

				assert.strictEqual(JSON.stringify(sds1), JSON.stringify(sds2));
			}
		},

		"#getSourceName()": {

			"should return the correct source name; $skip": function testSourceName(){
				var sds = new SkipDocumentSource();
				assert.strictEqual(sds.getSourceName(), "$skip");
			}

		},

		"#getSkip()": {
			"should return the skips": function () {
				var sds = new SkipDocumentSource();

				assert.strictEqual(sds.getSkip(), 0);
			}
		},

		"#setSkip()": {
			"should return the skips": function () {
				var sds = new SkipDocumentSource();

				sds.setSkip(10);

				assert.strictEqual(sds.getSkip(), 10);
			}
		},

		"#coalesce()": {

			"should return false if nextSource is not $skip": function dontSkip(){
				var sds = new SkipDocumentSource();
				assert.equal(sds.coalesce({}), false);
			},
			"should return true if nextSource is $skip": function changeSkip(){
				var sds = new SkipDocumentSource();
				assert.equal(sds.coalesce(new SkipDocumentSource()), true);
			}

		},

		"#getNext()": {

			"should throw an error if no callback is given": function() {
				var sds = new SkipDocumentSource();
				assert.throws(sds.getNext.bind(sds));
			},

			"should return EOF if there are no more sources": function noSources(next){
				var sds = new SkipDocumentSource();
				sds.skip = 3;
				sds.count = 0;

				var expected = [
					{val:4},
					null
				];
				var input = [
					{val:1},
					{val:2},
					{val:3},
					{val:4},
				];
				addSource(sds, input);

				async.series([
						sds.getNext.bind(sds),
						sds.getNext.bind(sds),
					],
					function(err,res) {
						assert.deepEqual(expected, res);
						next();
					}
				);
				sds.getNext(function(err, actual) {
					assert.equal(actual, null);
				});
			},
			"should return documents if skip count is not hit and there are more documents": function hitSkip(next){
				var sds = SkipDocumentSource.createFromJson(1);

				var input = [{val:1},{val:2},{val:3}];
				addSource(sds, input);

				sds.getNext(function(err,actual) {
					assert.notEqual(actual, null);
					assert.deepEqual(actual, {val:2});
					next();
				});
			},

			"should return the current document source": function currSource(){
				var sds = SkipDocumentSource.createFromJson(1);

				var input = [{val:1},{val:2},{val:3}];
				addSource(sds, input);

				sds.getNext(function(err, actual) {
					assert.deepEqual(actual, { val:2 });
				});
			},

			"should return false if we hit our limit": function noMoar(next){
				var sds = new SkipDocumentSource();
				sds.skip = 3;

				var expected = [
					{item:4},
					null
				];

				var input = [{item:1},{item:2},{item:3},{item:4}];
				addSource(sds, input);

				async.series([
						sds.getNext.bind(sds),
						sds.getNext.bind(sds),
					],
					function(err,res) {
						assert.deepEqual(expected, res);
						next();
					}
				);
			}

		},

		"#serialize()": {

			"should create an object with a key $skip and the value equal to the skip": function sourceToJsonTest(){
				var sds = new SkipDocumentSource();
				sds.skip = 9;
				var t = sds.serialize(false);
				assert.deepEqual(t, { "$skip": 9 });
			}

		},

		"#createFromJson()": {

			"should return a new SkipDocumentSource object from an input number": function createTest(){
				var t = SkipDocumentSource.createFromJson(5);
				assert.strictEqual(t.constructor, SkipDocumentSource);
				assert.strictEqual(t.skip, 5);
			}

		},

		"#getDependencies()": {
			"should return 1 (GET_NEXT)": function () {
				var sds = new SkipDocumentSource();

				assert.strictEqual(sds.getDependencies(), DocumentSource.GetDepsReturn.SEE_NEXT); //TODO: HACK. Getting an enum?
			}
		},

		"#getShardSource()": {
			"should return the instance of the SkipDocumentSource": function () {
				var sds = new SkipDocumentSource();

				assert.strictEqual(sds.getShardSource(), null);
			}
		},

		"#getRouterSource()": {
			"should return null": function () {
				var sds = new SkipDocumentSource();

				assert.strictEqual(sds.getRouterSource(), sds);
			}
		}
	}

};
