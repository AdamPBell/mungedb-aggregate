"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	Runner = require("../../../lib/query/Runner"),
	CursorDocumentSource = require("../../../lib/pipeline/documentSources/CursorDocumentSource"),
	LimitDocumentSource = require("../../../lib/pipeline/documentSources/LimitDocumentSource"),
	MatchDocumentSource = require("../../../lib/pipeline/documentSources/MatchDocumentSource"),
	ArrayRunner = require("../../../lib/query/ArrayRunner"),
	DocumentSourceRunner = require("../../../lib/query/DocumentSourceRunner");


module.exports = {

	"ArrayRunner": {
		"#constructor": {
			"should accept an array of data": function(){
				var cds = new CursorDocumentSource(null, new ArrayRunner([]), null),
					pipeline = [];
				assert.doesNotThrow(function(){
					new DocumentSourceRunner(cds, pipeline);
				});
			},
			"should fail if not given a document source or pipeline": function(){
				var cds = new CursorDocumentSource(null, new ArrayRunner([]), null);

				assert.throws(function(){
					new DocumentSourceRunner();
				});
				assert.throws(function(){
					new DocumentSourceRunner(123);
				});
				assert.throws(function(){
					new DocumentSourceRunner(cds, 123);
				});
			},
			"should coalesce the pipeline into the given documentsource": function(){
				var cds = new CursorDocumentSource(null, new ArrayRunner([]), null),
					pipeline = [new LimitDocumentSource(3), new MatchDocumentSource({"a":true})],
					expected = [{$match:{a:true}}];

				new DocumentSourceRunner(cds, pipeline);
				var actual = pipeline.map(function(d){return d.serialize();});

				assert.deepEqual(expected, actual);
			}
		},
		"#getNext": {
			"should return the next item in the given documentsource": function(done){
				var cds = new CursorDocumentSource(null, new ArrayRunner([1,2,3]), null),
					pipeline = [new LimitDocumentSource(3)];

				var ds = new DocumentSourceRunner(cds, pipeline);

				ds.getNext(function(err, out, state){
					assert.strictEqual(state, Runner.RunnerState.RUNNER_ADVANCED);
					assert.strictEqual(out, 1);
					ds.getNext(function(err, out, state){
						assert.strictEqual(state, Runner.RunnerState.RUNNER_ADVANCED);
						assert.strictEqual(out, 2);
						ds.getNext(function(err, out, state){
							assert.strictEqual(state, Runner.RunnerState.RUNNER_ADVANCED);
							assert.strictEqual(out, 3);
							done();
						});
					});
				});
			},
			"should return EOF if there is nothing left in the given documentsource": function(done){
				var cds = new CursorDocumentSource(null, new ArrayRunner([1,2,3]), null),
					pipeline = [new LimitDocumentSource({}, 1)];

				var ds = new DocumentSourceRunner(cds, pipeline);

				ds.getNext(function(err, out, state){
					assert.strictEqual(state, Runner.RunnerState.RUNNER_ADVANCED);
					assert.strictEqual(out, 1);
					ds.getNext(function(err, out, state){
						assert.strictEqual(state, Runner.RunnerState.RUNNER_EOF);
						assert.strictEqual(out, null);
						done();
					});
				});
			}
		},
		"#getInfo": {
			"should return nothing if explain flag is not set": function(){
				var cds = new CursorDocumentSource(null, new ArrayRunner([1,2,3]), null),
					pipeline = [new LimitDocumentSource({}, 1)];

				var ds = new DocumentSourceRunner(cds, pipeline);
				assert.strictEqual(ds.getInfo(), undefined);
			},
			"should return information about the runner if explain flag is set": function(){
				var cds = new CursorDocumentSource(null, new ArrayRunner([1,2,3]), null),
					pipeline = [new LimitDocumentSource({}, 1)];
				var ds = new DocumentSourceRunner(cds, pipeline);

				assert.deepEqual(ds.getInfo(true), {
					"type": "DocumentSourceRunner",
					"docSrc": {
						"$cursor": {
							"query": undefined,
							"sort": null,
							"limit": 1,
							"fields": null,
							"plan": {
								"type": "ArrayRunner",
								"nDocs": 3,
								"position": 0,
								"state": Runner.RunnerState.RUNNER_ADVANCED
							}
						}
					},
					"state": Runner.RunnerState.RUNNER_ADVANCED
				});
			}
		},
		"#reset": {
			"should dispose of the documentSource": function(){
				var cds = new CursorDocumentSource(null, new ArrayRunner([1,2,3]), null),
					pipeline = [new LimitDocumentSource({}, 1)];
				var ds = new DocumentSourceRunner(cds, pipeline);

				ds.reset();
				assert.deepEqual(ds.getInfo(true), {
					"type": "DocumentSourceRunner",
					"docSrc": {
						"$cursor": {
							"query": undefined,
							"sort": null,
							"limit": 1,
							"fields": null,
							"plan": {
								"type": "ArrayRunner",
								"nDocs": 0,
								"position": 0,
								"state": Runner.RunnerState.RUNNER_DEAD
							}
						}
					},
					"state": Runner.RunnerState.RUNNER_DEAD
				});
			}
		}
	}

};
