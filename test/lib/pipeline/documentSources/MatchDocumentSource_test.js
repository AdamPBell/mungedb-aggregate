"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	async = require("async"),
	MatchDocumentSource = require("../../../../lib/pipeline/documentSources/MatchDocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	ArrayRunner = require("../../../../lib/query/ArrayRunner");

function testRedactSafe(input, safePortion) {
	var match = MatchDocumentSource.createFromJson(input);
	assert.deepEqual(match.redactSafePortion(), safePortion);
}

function addSource(match, data) {
	var cds = new CursorDocumentSource(null, new ArrayRunner(data), null);
	match.setSource(cds);
}

module.exports = {

	"MatchDocumentSource": {

		"constructor()": {

			"should throw Error when constructing without args": function testConstructor(){
				assert.throws(function(){
					new MatchDocumentSource();
				});
			},

			"should throw Error when trying to using a $text operator": function testTextOp () {
				assert.throws(function(){
					new MatchDocumentSource({packet:{ $text:"thisIsntImplemented" } });
				});
			}

		},

		"#getSourceName()": {

			"should return the correct source name; $match": function testSourceName(){
				var mds = new MatchDocumentSource({ packet :{ $exists : false } });
				assert.strictEqual(mds.getSourceName(), "$match");
			}

		},

		"#serialize()": {

			"should append the match query to the input builder": function sourceToJsonTest(){
				var mds = new MatchDocumentSource({ location : { $in : ["Kentucky"] } });
				var t = mds.serialize(false);
				assert.deepEqual(t, { "$match" : { location : { $in : ["Kentucky"] } }});
			}

		},

		"#createFromJson()": {

			"should return a new MatchDocumentSource object from an input object": function createTest(){
				var t = MatchDocumentSource.createFromJson({ someval:{$exists:true} });
				assert.strictEqual(t instanceof MatchDocumentSource, true);
			}

		},

		"#getNext()": {

			"should throw an error if no callback is given": function() {
				var mds = new MatchDocumentSource({item:1});
				assert.throws(mds.getNext.bind(mds));
			},

			"should return the current document source": function currSource(next){
				var mds = new MatchDocumentSource({item: 1});
				addSource(mds, [{ item:1 }]);
				mds.getNext(function(err,val) {
					assert.deepEqual(val, { item:1 });
					next();
				});
			},

			"should return matched sources remaining": function (next){
				var mds = new MatchDocumentSource({ item: {$lt: 5} }),
					items = [ 1,2,3,4,5,6,7,8,9 ];
				addSource(mds, items.map(function(i){return {item:i};}));

				async.series([
						mds.getNext.bind(mds),
						mds.getNext.bind(mds),
						mds.getNext.bind(mds),
						mds.getNext.bind(mds),
						mds.getNext.bind(mds),
					],
					function(err,res) {
						assert.deepEqual([{item:1},{item:2},{item:3},{item:4},null], res);
						next();
					}
				);
			},

			"should not return matched out documents for sources remaining": function (next){
				var mds = new MatchDocumentSource({ item: {$gt: 5} }),
					items = [ 1,2,3,4,5,6,7,8,9 ];
				addSource(mds, items.map(function(i){return {item:i};}));

				async.series([
						mds.getNext.bind(mds),
						mds.getNext.bind(mds),
						mds.getNext.bind(mds),
						mds.getNext.bind(mds),
						mds.getNext.bind(mds),
					],
					function(err,res) {
						assert.deepEqual([{item:6},{item:7},{item:8},{item:9},null], res);
						next();
					}
				);
			},

			"should return EOF for no sources remaining": function (next){
				var mds = new MatchDocumentSource({ item: {$gt: 5} }),
					items = [ ];
				addSource(mds, items.map(function(i){return {item:i};}));

				async.series([
						mds.getNext.bind(mds),
					],
					function(err,res) {
						assert.deepEqual([null], res);
						next();
					}
				);
			},

		},

		"#coalesce()": {

			"should return false if nextSource is not $match": function dontSkip(){
				var mds = new MatchDocumentSource({item: {$lt:3}});
				assert.equal(mds.coalesce({}), false);
			},
			"should return true if nextSource is $limit": function changeLimit(){
				var mds = new MatchDocumentSource({item:{$gt:1}}),
					mds2 = new MatchDocumentSource({item:{$lt:3}}),
					expected = {$and: [{item:{$gt:1}}, {item:{$lt:3}}]};

				var actual = mds.coalesce(mds2);
				assert.equal(actual, true);
				assert.deepEqual(mds.getQuery(), expected);
			},

			"should merge two MatchDocumentSources together": function() {
				var match1 = MatchDocumentSource.createFromJson({ a: 1 }),
					match2 = MatchDocumentSource.createFromJson({ b: 1 }),
					match3 = MatchDocumentSource.createFromJson({ c: 1 });

				// check initial state
				assert.deepEqual(match1.getQuery(), {a:1});
				assert.deepEqual(match2.getQuery(), {b:1});
				assert.deepEqual(match3.getQuery(), {c:1});

				assert.doesNotThrow(function() {
					match1.coalesce(match2);
				});
				assert.deepEqual(match1.getQuery(), {$and: [{a:1}, {b:1}]});
			},

			"should merge three MatchDocumentSources together": function() {
				var match1 = MatchDocumentSource.createFromJson({ a: 1 }),
					match2 = MatchDocumentSource.createFromJson({ b: 1 }),
					match3 = MatchDocumentSource.createFromJson({ c: 1 });

				// check initial state
				assert.deepEqual(match1.getQuery(), {a:1});
				assert.deepEqual(match2.getQuery(), {b:1});
				assert.deepEqual(match3.getQuery(), {c:1});

				assert.doesNotThrow(function() {
					match1.coalesce(match2);
				});
				assert.deepEqual(match1.getQuery(), {$and: [{a:1}, {b:1}]});

				assert.doesNotThrow(function() {
					match1.coalesce(match3);
				});
				assert.deepEqual(match1.getQuery(), {$and: [{$and: [{a:1}, {b:1}]}, {c:1}]});
			}

		},

		"#getQuery()": {

			"should return current query": function () {
				var mds = new MatchDocumentSource({item: {$gt:1}});
				var actual = mds.getQuery();

				assert.deepEqual(actual, {item:{$gt:1}});
			}

		},

		"#redactSafePortion()": {

			"empty match": function() {
				testRedactSafe({}, {});
			},

			"basic allowed things": function () {
				testRedactSafe({a:1},
					{a:1});

				testRedactSafe({a:"asdf"},
					{a:"asdf"});

				testRedactSafe({a:/asdf/i},
					{a:/asdf/i});

				testRedactSafe({a: {$regex: "adsf"}},
					{a: {$regex: "adsf"}});

				testRedactSafe({a: {$regex: "adsf", $options: "i"}},
					{a: {$regex: "adsf", $options: "i"}});

				testRedactSafe({a: {$mod: [1, 0]}},
					{a: {$mod: [1, 0]}});

				testRedactSafe({a: {$type: 1}},
					{a: {$type: 1}});

			},

			"basic disallowed things": function() {

				testRedactSafe({a: null},
					{});

				testRedactSafe({a: {}},
					{});

				testRedactSafe({a: []},
					{});

				testRedactSafe({"a.0": 1},
					{});

				testRedactSafe({"a.0.b": 1},
					{});

				testRedactSafe({a: {$ne: 1}},
					{});

				testRedactSafe({a: {$nin: [1, 2, 3]}},
					{});

				testRedactSafe({a: {$exists: true}}, // could be allowed but currently isn't
					{});

				testRedactSafe({a: {$exists: false}}, // can never be allowed
					{});

				testRedactSafe({a: {$size: 1}},
					{});

				testRedactSafe({$nor: [{a:1}]},
					{});

			},

			"Combinations": function() {
				testRedactSafe({a:1, b: "asdf"},
					{a:1, b: "asdf"});

				testRedactSafe({a:1, b: null},
					{a:1});

				testRedactSafe({a:null, b: null},
					{});
			},

			"$elemMatch": function() {
				testRedactSafe({a: {$elemMatch: {b: 1}}},
					{a:{$elemMatch:{b: 1}}});

				testRedactSafe({a:{$elemMatch:{b:null}}},
					{});

				testRedactSafe({a:{$elemMatch:{b:null, c:1}}},
					{a:{$elemMatch:{c: 1}}});
			},

			"explicit $and": function(){
				testRedactSafe({$and:[{a: 1}]},
					{$and:[{a: 1}]});

				testRedactSafe({$and:[{a: 1},{b: null}]},
					{$and:[{a: 1}]});

				testRedactSafe({$and:[{a: 1},{b: null, c:1}]},
					{$and:[{a: 1},{c:1}]});

				testRedactSafe({$and:[{a: null},{b: null}]},
					{});
			},

			"explicit $or": function() {
				testRedactSafe({$or:[{a: 1}]},
					{$or:[{a: 1}]});

				testRedactSafe({$or:[{a: 1},{b: null}]},
					{});

				testRedactSafe({$or:[{a: 1},{b: null, c:1}]},
					{$or:[{a: 1}, {c:1}]});

				testRedactSafe({$or:[{a: null},{b: null}]},
					{});

				testRedactSafe({},
					{});
			},

			"$all and $in": function() {
				testRedactSafe({a:{$all: [1, 0]}},
					{a: {$all: [1, 0]}});

				testRedactSafe({a:{$all: [1, 0, null]}},
					{a: {$all: [1, 0]}});

				testRedactSafe({a:{$all: [{$elemMatch: {b:1}}]}}, // could be allowed but currently isn't
					{});

				testRedactSafe({a:{$all: [1, 0, null]}},
					{a: {$all: [1, 0]}});

				testRedactSafe({a:{$in: [1, 0]}},
					{a: {$in: [1, 0]}});

				testRedactSafe({a:{$in: [1, 0, null]}},
					{});
			}

		},

		"#isTextQuery()": {

			"should return true when $text operator is first stage in pipeline": function () {
				var query = {$text:"textQuery"};
				assert.ok(MatchDocumentSource.isTextQuery(query)); // true
			},

			"should return true when $text operator is nested in the pipeline": function () {
				var query = {$stage:{$text:"textQuery"}};
				assert.ok(MatchDocumentSource.isTextQuery(query)); // true
			},

			"should return false when $text operator is not in pipeline": function () {
				var query = {$notText:"textQuery"};
				assert.ok(!MatchDocumentSource.isTextQuery(query)); // false
			}

		},

		"#uassertNoDisallowedClauses()": {

			"should throw if invalid stage is in match expression": function () {
				var whereQuery = {$where:"where"};
				assert.throws(function(){
					MatchDocumentSource.uassertNoDisallowedClauses(whereQuery);
				});

				var nearQuery = {$near:"near"};
				assert.throws(function(){
					MatchDocumentSource.uassertNoDisallowedClauses(nearQuery);
				});

				var withinQuery = {$within:"within"};
				assert.throws(function(){
					MatchDocumentSource.uassertNoDisallowedClauses(withinQuery);
				});

				var nearSphereQuery = {$nearSphere:"nearSphere"};
				assert.throws(function(){
					MatchDocumentSource.uassertNoDisallowedClauses(nearSphereQuery);
				});
			},

			"should throw if invalid stage is nested in the match expression": function () {
				var whereQuery = {$validStage:{$where:"where"}};
				assert.throws(function(){
					MatchDocumentSource.uassertNoDisallowedClauses(whereQuery);
				});

				var nearQuery = {$validStage:{$near:"near"}};
				assert.throws(function(){
					MatchDocumentSource.uassertNoDisallowedClauses(nearQuery);
				});

				var withinQuery = {$validStage:{$within:"within"}};
				assert.throws(function(){
					MatchDocumentSource.uassertNoDisallowedClauses(withinQuery);
				});

				var nearSphereQuery = {$validStage:{$nearSphere:"nearSphere"}};
				assert.throws(function(){
					MatchDocumentSource.uassertNoDisallowedClauses(nearSphereQuery);
				});
			},

			"should not throw if invalid stage is not in match expression": function () {
				var query = {$valid:"valid"};
				assert.doesNotThrow(function(){
					MatchDocumentSource.uassertNoDisallowedClauses(query);
				});
			},

			"should not throw if invalid stage is not nested in the match expression": function () {
				var query = {$valid:{$anotherValid:"valid"}};
				assert.doesNotThrow(function(){
					MatchDocumentSource.uassertNoDisallowedClauses(query);
				});
			},

		}

	}

};