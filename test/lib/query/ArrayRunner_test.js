"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	Runner = require("../../../lib/query/Runner"),
	ArrayRunner = require("../../../lib/query/ArrayRunner");

exports.ArrayRunner = {

	"#constructor": {

		"should accept an array of data": function(){
			assert.doesNotThrow(function(){
				new ArrayRunner([1,2,3]);
			});
		},

		"should fail if not given an array": function(){
			assert.throws(function(){
				new ArrayRunner();
			});
			assert.throws(function(){
				new ArrayRunner(123);
			});
		}
	},

	"#getNext": {

		"should return the next item in the array": function(done){
			var ar = new ArrayRunner([1,2,3]);

			ar.getNext(function(err, out, state){
				assert.strictEqual(state, Runner.RunnerState.RUNNER_ADVANCED);
				assert.strictEqual(out, 1);
				ar.getNext(function(err, out, state){
					assert.strictEqual(state, Runner.RunnerState.RUNNER_ADVANCED);
					assert.strictEqual(out, 2);
					ar.getNext(function(err, out, state){
						assert.strictEqual(state, Runner.RunnerState.RUNNER_ADVANCED);
						assert.strictEqual(out, 3);
						done();
					});
				});
			});
		},

		"should return EOF if there is nothing left in the array": function(done){
			var ar = new ArrayRunner([1]);

			ar.getNext(function(err, out, state){
				assert.strictEqual(state, Runner.RunnerState.RUNNER_ADVANCED);
				assert.strictEqual(out, 1);
				ar.getNext(function(err, out, state){
					assert.strictEqual(state, Runner.RunnerState.RUNNER_EOF);
					assert.strictEqual(out, undefined);
					done();
				});
			});
		},

	},

	"#getInfo": {

		"should return nothing if explain flag is not set": function(){
			var ar = new ArrayRunner([1,2,3]);
			assert.strictEqual(ar.getInfo(), undefined);
		},

		"should return information about the runner if explain flag is set": function(){
			var ar = new ArrayRunner([1,2,3]);
			assert.deepEqual(ar.getInfo(true), {
				"type":"ArrayRunner",
				"nDocs":3,
				"position":0,
				"state": Runner.RunnerState.RUNNER_ADVANCED
			});
		},

	},

};
