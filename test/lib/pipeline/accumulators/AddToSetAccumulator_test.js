"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	AddToSetAccumulator = require("../../../../lib/pipeline/accumulators/AddToSetAccumulator");


var testData = { //jshint nonbsp:false
	nil: null,
	bF: false, bT: true,
	numI: 123, numF: 123.456,
	str: "TesT! mmm π",
	obj: {foo:{bar:"baz"}},
	arr: [1, 2, 3, [4, 5, 6]],
	date: new Date(),
	re: /foo/gi,
}; //jshint nonbsp:true

//TODO: refactor these test cases using Expression.parseOperand() or something because these could be a whole lot cleaner...
exports.AddToSetAccumulator = {

	".constructor()": {

		"should create instance of Accumulator": function() {
			assert(new AddToSetAccumulator() instanceof AddToSetAccumulator);
		},

		"should error if called with args": function() {
			assert.throws(function() {
				new AddToSetAccumulator(123);
			});
		}

	},

	".create()": {

		"should return an instance of the accumulator": function() {
			assert(AddToSetAccumulator.create() instanceof AddToSetAccumulator);
		}

	},

	"#process()": {

		"should add input to set": function() {
			var acc = AddToSetAccumulator.create();
			acc.process(testData);
			assert.deepEqual(acc.getValue(), [testData]);
		},

		"should add input iff not already in set": function() {
			var acc = AddToSetAccumulator.create();
			acc.process(testData);
			acc.process(testData);
			assert.deepEqual(acc.getValue(), [testData]);
		},

		"should merge input into set": function() {
			var acc = AddToSetAccumulator.create();
			acc.process(testData);
			acc.process([testData, 42], true);
			assert.deepEqual(acc.getValue(), [42, testData]);
		},

	},

	"#getValue()": {

		"should return empty set initially": function() {
			var acc = new AddToSetAccumulator.create();
			var value = acc.getValue();
			assert.equal((value instanceof Array), true);
			assert.equal(value.length, 0);
		},

		"should return set of added items": function() {
			var acc = AddToSetAccumulator.create(),
				expected = [
					42,
					{foo:1, bar:2},
					{bar:2, foo:1},
					testData
				];
			expected.forEach(function(input){
				acc.process(input);
			});
			assert.deepEqual(acc.getValue(), expected);
		},

	}

};
