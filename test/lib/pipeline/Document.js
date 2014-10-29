"use strict";
var assert = require("assert"),
	Document = require("../../../lib/pipeline/Document"),
	FieldPath = require("../../../lib/pipeline/FieldPath");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.Document = {

	//SKIPPED: Create -- ours is a static class so we have no constructor

	//SKIPPED: CreateFromBsonObj -- no ctor again, would just use JSON.parse

	//SKIPPED: AddField - no need because we use:  obj[key] = val

	//SKIPPED: GetValue - no need because we use:  val = obj[key]

	//SKIPPED: SetField - no need because we usually use:  obj[key] = val  though setNestedField *does* is implemented now

	".compare()": {

		"should work": function testCompare() {
            assertComparison(0, {}, {});
            assertComparison(0, {a:1}, {a:1});
            assertComparison(-1, {}, {a:1});
            assertComparison(-1, {a:1}, {c:1});
            assertComparison(0, {a:1,r:2}, {a:1,r:2});
            assertComparison(-1, {a:1}, {a:1,r:2});
            assertComparison(0, {a:2}, {a:2});
            assertComparison(-1, {a:1}, {a:2});
            assertComparison(-1, {a:1,b:1}, {a:1,b:2});
            // numbers sort before strings
            assertComparison(-1, {a:1}, {a:"foo"});
			// helpers for the above
			function cmp(a, b) {
				var result = Document.compare(a, b);
				return result < 0 ? -1 : // sign
					result > 0 ? 1 :
					0;
			}
			function assertComparison(expectedResult, a, b) {
				assert.strictEqual(expectedResult, cmp(a, b));
				assert.strictEqual(-expectedResult, cmp(b, a));
				if (expectedResult === 0) {
					var hash = JSON.stringify; // approximating real hash
					assert.strictEqual(hash(a), hash(b));
				}
			}
		},

		"should work for a null": function testCompareNamedNull(){
			var obj1 = {z:null},
				obj2 = {a:1};
            //// Comparsion with type precedence.
			// assert(obj1.woCompare(obj2) < 0); //NOTE: probably will not need this
            // Comparison with field name precedence.
			assert(Document.compare(obj1, obj2) > 0);
		},

		"should return 0 if Documents are identical": function() {
			var lDocument = {prop1: 0},
				rDocument = {prop1: 0},
				result = Document.compare(lDocument, rDocument);
			assert.equal(result, 0);
		},

		"should return -1 if left Document is shorter": function() {
			var lDocument = {prop1: 0},
				rDocument = {prop1: 0, prop2: 0},
				result = Document.compare(lDocument, rDocument);
			assert.equal(result, -1);
		},

		"should return 1 if right Document is shorter": function() {
			var lDocument = {prop1: 0, prop2: 0},
				rDocument = {prop1: 0},
				result = Document.compare(lDocument, rDocument);
			assert.equal(result, 1);
		},

		"should return nameCmp result -1 if left Document field value is less": function() {
			var lDocument = {prop1: 0},
				rDocument = {prop1: 1},
				result = Document.compare(lDocument, rDocument);
			assert.equal(result, -1);
		},

		"should return nameCmp result 1 if right Document field value is less": function() {
			var lDocument = {prop1: 1},
				rDocument = {prop1: 0},
				result = Document.compare(lDocument, rDocument);
			assert.equal(result, 1);
		},

	},

	".clone()": {

		"should shallow clone a single field document": function testClone() {
			var doc = {a:{b:1}},
				clone = doc;

			//NOTE: silly since we use static helpers but here for consistency
			// Check equality
			assert.strictEqual(clone, doc);
			// Check pointer equality of sub document
			assert.strictEqual(clone.a, doc.a);

			// Change field in clone and ensure the original document's field is unchanged.
			clone = Document.clone(doc);
			clone.a = 2;
			assert.strictEqual(Document.getNestedField(doc, new FieldPath("a.b")), 1);

			// setNestedField and ensure the original document is unchanged.
			clone = Document.cloneDeep(doc);
			assert.strictEqual(Document.getNestedField(doc, "a.b"), 1);

			Document.setNestedField(clone, "a.b", 2);

			assert.strictEqual(Document.getNestedField(doc, "a.b"), 1);
			assert.strictEqual(Document.getNestedField(clone, "a.b"), 2);
			assert.deepEqual(doc, {a:{b:1}});
			assert.deepEqual(clone, {a:{b:2}});
		},

		"should shallow clone a multi field document": function testCloneMultipleFields() {
			var doc = {a:1,b:['ra',4],c:{z:1},d:'lal'},
				clone = Document.clone(doc);
			assert.deepEqual(doc, clone);
		},

	},

	//SKIPPED: FieldIteratorEmpty

	//SKIPPED: FieldIteratorSingle

	//SKIPPED: FieldIteratorMultiple

	".toJson()": {

		"should convert to JSON Object": function() {
			var doc = {prop1:0};
			assert.deepEqual(Document.toJson(doc), {prop1:0});
		},

	},

	"serialize and deserialize for sorter": {

		"should return a string": function serializeDocument() {
			var doc = {prop1:1},
				res = Document.serializeForSorter(doc);
			assert.equal(res, "{\"prop1\":1}");
		},

		"should return a Document": function deserializeToDocument() {
			var str = "{\"prop1\":1}",
				doc = {prop1:1},
				res = Document.deserializeForSorter(str);
			assert.deepEqual(res, doc);
		},

	},

};
