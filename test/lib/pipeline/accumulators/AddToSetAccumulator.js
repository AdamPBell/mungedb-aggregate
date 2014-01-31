"use strict";
var assert = require("assert"),
	AddToSetAccumulator = require("../../../../lib/pipeline/accumulators/AddToSetAccumulator"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression");


var createAccumulator = function createAccumulator() {
	return new AddToSetAccumulator();
};


//TODO: refactor these test cases using Expression.parseOperand() or something because these could be a whole lot cleaner...
module.exports = {

	"AddToSetAccumulator": {

		"constructor()": {

			"should error if called with args": function testArgsGivenToCtor() {
				assert.throws(function() {
					new AddToSetAccumulator('arg');
				});
			},

			"should construct object with set property": function testCtorAssignsSet() {
				var acc = new AddToSetAccumulator();
				assert.notEqual(acc.set, null);
				assert.notEqual(acc.set, undefined);
			}

		},

		"#processInternal()" : {
			"should add input to set": function testAddsToSet() {
				var acc = createAccumulator();
				acc.processInternal({b:5});
				var value = acc.getValue();
				assert.deepEqual(JSON.stringify(value), JSON.stringify([5]));
			}

		},

		"#getValue()": {

			"should return empty array": function testEmptySet() {
				var acc = new createAccumulator();
				var value = acc.getValue();
				assert.equal((value instanceof Array), true);
				assert.equal(value.length, 0);
			},

			"should return array with one element that equals 5": function test5InSet() {
				var acc = createAccumulator();
				acc.processInternal({b:5});
				acc.processInternal({b:5});
				var value = acc.getValue();
				assert.deepEqual(JSON.stringify(value), JSON.stringify([5]));
			},

			"should produce value that is an array of multiple elements": function testMultipleItems() {
				var acc = createAccumulator();
				acc.processInternal({b:5});
				acc.processInternal({b:{key: "value"}});
				var value = acc.getValue();
				assert.deepEqual(JSON.stringify(value), JSON.stringify([5, {key: "value"}]));
			},

			"should return array with one element that is an object containing a key/value pair": function testKeyValue() {
				var acc = createAccumulator();
				acc.processInternal({b:{key: "value"}});
				var value = acc.getValue();
				assert.deepEqual(JSON.stringify(value), JSON.stringify([{key: "value"}]));
			},

			"should not require defining values": function testKeyValue() {
				var acc = createAccumulator();
				acc.processInternal({b:{key: "value"}});
				acc.processInternal({a:5});
				var value = acc.getValue();
				assert.deepEqual(JSON.stringify(value), JSON.stringify([5, {key: "value"}]));
			},

			"should coalesce different instances of equivalent objects": function testGetValue_() {
				var acc = createAccumulator();
				acc.processInternal({b:{key: "value"}});
				acc.processInternal({b:{key: "value"}});
				var value = acc.getValue();
				assert.deepEqual(JSON.stringify(value), JSON.stringify([{key: "value"}]));
			}

		}

	}

};


if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
