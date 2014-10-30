"use strict";
var assert = require("assert"),
	LastAccumulator = require("../../../../lib/pipeline/accumulators/LastAccumulator");

function createAccumulator(){
	return new LastAccumulator();
}


module.exports = {

	"LastAccumulator": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new LastAccumulator();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $last": function testOpName(){
				assert.strictEqual(new LastAccumulator().getOpName(), "$last");
			}

		},

		"#processInternal()": {

			"should evaluate no documents": function testStuff(){
				var lastAccumulator = createAccumulator();
				assert.strictEqual(lastAccumulator.getValue(), undefined);
			},


			"should evaluate one document and retains its value": function testStuff(){
				var lastAccumulator = createAccumulator();
				lastAccumulator.processInternal(5);
				assert.strictEqual(lastAccumulator.getValue(), 5);

			},


			"should evaluate one document with the field missing retains undefined": function testStuff(){
				var lastAccumulator = createAccumulator();
				lastAccumulator.processInternal();
				assert.strictEqual(lastAccumulator.getValue(), undefined);
			},


			"should evaluate two documents and retains the value in the last": function testStuff(){
				var lastAccumulator = createAccumulator();
				lastAccumulator.processInternal(5);
				lastAccumulator.processInternal(7);
				assert.strictEqual(lastAccumulator.getValue(), 7);
			},


			"should evaluate two documents and retains the undefined value in the last": function testStuff(){
				var lastAccumulator = createAccumulator();
				lastAccumulator.processInternal(5);
				lastAccumulator.processInternal();
				assert.strictEqual(lastAccumulator.getValue(), undefined);
			}
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
