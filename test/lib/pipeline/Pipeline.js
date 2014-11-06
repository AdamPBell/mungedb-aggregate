"use strict";
var assert = require("assert"),
	Pipeline = require("../../../lib/pipeline/Pipeline"),
	FieldPath = require("../../../lib/pipeline/FieldPath"),
	DocumentSource = require('../../../lib/pipeline/documentSources/DocumentSource'),
	CursorDocumentSource = require("../../../lib/pipeline/documentSources/CursorDocumentSource"),
	ProjectDocumentSource = require("../../../lib/pipeline/documentSources/ProjectDocumentSource"),
	ArrayRunner = require("../../../lib/query/ArrayRunner");

var addSource = function addSource(match, data) {
	var cds = new CursorDocumentSource(null, new ArrayRunner(data), null);
	match.setSource(cds);
};

var shardedTest = function(inputPipeString, expectedMergePipeString, expectedShardPipeString) {
	inputPipeString = '{"pipeline": ' + inputPipeString + '}';
	expectedMergePipeString = '{"pipeline": ' + expectedMergePipeString + '}';
	expectedShardPipeString = '{"pipeline": ' + expectedShardPipeString + '}';
	var inputPipe = JSON.parse(inputPipeString),
		expectedMergePipe = JSON.parse(expectedMergePipeString),
		expectedShardPipe = JSON.parse(expectedShardPipeString);

	var mergePipe = Pipeline.parseCommand(inputPipe, {});
	assert.notEqual(mergePipe, null);

	var shardPipe = mergePipe.splitForSharded();
	assert.notEqual(shardPipe, null);

	assert.deepEqual(shardPipe.serialize()["pipeline"], 
		expectedShardPipe["pipeline"]);
	assert.deepEqual(mergePipe.serialize()["pipeline"],
		expectedMergePipe["pipeline"]);
};

module.exports = {

	"Pipeline": {

		before: function () {

			Pipeline.stageDesc.$test = (function () {
				var klass = function TestDocumentSource(options, ctx) {
					base.call(this, ctx);

					this.shouldCoalesce = options.coalesce;
					this.coalesceWasCalled = false;
					this.optimizeWasCalled = false;
					this.works = options.works === false ? false : true; // don't judge

					this.current = 5;

				}, TestDocumentSource = klass, base = DocumentSource, proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});


				proto.coalesce = function () {
					this.coalesceWasCalled = true;
					var c = this.shouldCoalesce;//only coalesce with the first thing we find
					this.shouldCoalesce = false;
					return c;
				};

				proto.optimize = function () {
					this.optimizeWasCalled = true;
				};

				proto.getNext = function(callback){
					var answer = this.current > 0 ? {val:this.current--} : null,
						err = null;

					if (!this.works)
						err = new Error("doesn't work"), answer = undefined;

					if(callback) {
						return callback(err, answer);
					} else {
						return answer || err;
					}
				};

				klass.createFromJson = function (options, ctx) {
					return new TestDocumentSource(options, ctx);
				};

				return klass;
			})().createFromJson;

		},

		"parseCommand": {

			"should throw Error if given non-objects in the array": function () {
				assert.throws(function () {
					Pipeline.parseCommand({pipeline: [5]});
				});
			},

			"should throw Error if given objects with more / less than one field": function () {
				assert.throws(function () {
					Pipeline.parseCommand({pipeline: [
						{}
					]});
					Pipeline.parseCommand({pipeline: [
						{a: 1, b: 2}
					]});
				});
			},

			"should throw Error on unknown document sources": function () {
				assert.throws(function () {
					Pipeline.parseCommand({pipeline: [
						{$foo: "$sdfdf"}
					]});
				});
			},

			"should swap $match and $sort if the $match immediately follows the $sort": function () {
				var p = Pipeline.parseCommand({pipeline: [
					{$sort: {"xyz": 1}},
					{$match: {}}
				]});
				assert.equal(p.sources[0].constructor.matchName, "$match");
				assert.equal(p.sources[1].constructor.sortName, "$sort");
			},

			"should attempt to coalesce all sources": function () {
				var p = Pipeline.parseCommand({pipeline: [
					{$test: {coalesce: false}},
					{$test: {coalesce: true}},
					{$test: {coalesce: false}},
					{$test: {coalesce: false}}
				]});
				assert.equal(p.sources.length, 3);
				p.sources.slice(0, -1).forEach(function (source) {
					assert.equal(source.coalesceWasCalled, true);
				});
				assert.equal(p.sources[p.sources.length -1].coalesceWasCalled, false);
			},

			"should optimize all sources": function () {
				var p = Pipeline.parseCommand({pipeline: [
					{$test: {coalesce: false}},
					{$test: {coalesce: false}}
				]});
				p.sources.forEach(function (source) {
					assert.equal(source.optimizeWasCalled, true);
				});
			}
		},

		"sharded": {

			"should handle empty pipeline for sharded": function () {
				var inputPipe = "[]",
					expectedMergePipe = "[]",
					expectedShardPipe = "[]";
				shardedTest(inputPipe, expectedMergePipe, expectedShardPipe);
			},

			"should handle one unwind": function () {
				var inputPipe = '[{"$unwind":"$a"}]',
					expectedMergePipe = "[]",
					expectedShardPipe = '[{"$unwind":"$a"}]';
				shardedTest(inputPipe, expectedMergePipe, expectedShardPipe);
			},

			"should handle two unwinds": function () {
				var inputPipe = '[{"$unwind":"$a"}, {"$unwind":"$b"}]',
					expectedMergePipe = "[]",
					expectedShardPipe = '[{"$unwind": "$a"}, {"$unwind": "$b"}]';
				shardedTest(inputPipe, expectedMergePipe, expectedShardPipe);

			}

		},

		"#stitch": {
			"should set the parent source for all sources in the pipeline except the first one": function () {
				var p = Pipeline.parseCommand({pipeline:[{$test:{coalesce:false}}, {$test:{coalesce:false}}, {$test:{coalesce:false}}]});
				p.stitch();
				assert.equal(p.sources[1].source, p.sources[0]);
			}
		},

		"#run": {

			"should iterate through sources and return resultant array": function (done) {
				var p = Pipeline.parseCommand({pipeline:[{$test:{coalesce:false}}, {$test:{coalesce:false}}, {$test:{coalesce:false}}]}),
					results = [];
				p.run(function(err, doc) {
					if (err) throw err;
					if (!doc){
						assert.deepEqual(results, [ { val: 5 }, { val: 4 }, { val: 3 }, { val: 2 }, { val: 1 } ]);
						done();
					} else {
						results.push(doc);
					}
				});
			},
			"should handle sources that return errors": function (done) {
				var p = Pipeline.parseCommand({pipeline:[{$test:{works:false}}]}),
					results = [];
				p.run(function(err, doc) {
					assert(err);
					done();
				});
			}
		},

		"#addInitialSource": {
			"should put the given source at the beginning of the pipeline": function () {
				var p = Pipeline.parseCommand({pipeline:[{$test:{coalesce:false}}, {$test:{coalesce:false}}, {$test:{coalesce:false}}]}),
					initialSource = Pipeline.stageDesc.$test({coalesce:false});
				p.addInitialSource(initialSource);
				assert.equal(initialSource, p.sources[0]);
			},

			"should be able to addInitialSource then stitch": function () {
				var p = Pipeline.parseCommand({pipeline:[{$test:{coalesce:false}}, {$test:{coalesce:false}}, {$test:{coalesce:false}}]}),
					initialSource = Pipeline.stageDesc.$test({coalesce:false});
				p.addInitialSource(initialSource);
				p.stitch();
				assert.equal(p.sources[1].source, p.sources[0]);
			}
		},

		"#getDependencies()": {

			"should properly detect dependencies": function testGetDependencies() {
				var p = Pipeline.parseCommand({pipeline: [
					{$sort: {"xyz": 1}},
					{$project: {"a":"$xyz"}}
				]});
				var depsTracker = p.getDependencies();
				assert.equal(Object.keys(depsTracker.fields).length, 2);
			}

		}
	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).grep(process.env.MOCHA_GREP || '').run(process.exit);
