"use strict";
var assert = require("assert"),
	Runner = require("../../lib/Runner"),
	ArrayRunner = require("../../lib/ArrayRunner");

module.exports = {

	"ArrayRunner": {
		"#constructor": {
			"should accept an array of data": function(){
				assert.doesNotThrow(function(){
					var ar = new ArrayRunner([1,2,3]);
				});
			},
			"should fail if not given an array": function(){
				assert.throws(function(){
					var ar = new ArrayRunner();
				});
				assert.throws(function(){
					var ar = new ArrayRunner(123);
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
			}
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
			}
		},
		"#reset": {
			"should clear out the runner": function(){
				var ar = new ArrayRunner([1,2,3]);
				ar.reset();
				
				assert.deepEqual(ar.getInfo(true), {
					"type":"ArrayRunner",
					"nDocs":0,
					"position":0,
					"state": Runner.RunnerState.RUNNER_DEAD
				});				
			}
		}
	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run();
