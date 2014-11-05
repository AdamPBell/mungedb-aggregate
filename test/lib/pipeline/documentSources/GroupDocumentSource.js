"use strict";
var assert = require("assert"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	GroupDocumentSource = require("../../../../lib/pipeline/documentSources/GroupDocumentSource"),
	ArrayRunner = require("../../../../lib/query/ArrayRunner"),
	async = require('async'),
	utils = require("../expressions/utils"),
	expressions = require("../../../../lib/pipeline/expressions");


/// An assertion for `ObjectExpression` instances based on Mongo's `ExpectedResultBase` class
function assertExpectedResult(args) {
	{// check for required args
		if (args === undefined) throw new TypeError("missing arg: `args` is required");
		if (args.spec && args.throw === undefined) args.throw = true; // Assume that spec only tests expect an error to be thrown
		//if (args.spec === undefined) throw new Error("missing arg: `args.spec` is required");
		if (args.expected !== undefined && args.docs === undefined) throw new Error("must provide docs with expected value");
	}// check for required args

	// run implementation
	if(args.expected && args.docs){
		var gds = GroupDocumentSource.createFromJson(args.spec),
			next,
			results = [],
			cds = new CursorDocumentSource(null, new ArrayRunner(args.docs), null);
			debugger;
		gds.setSource(cds);
		async.whilst(
			function() {
				return next !== null;
			},
			function(done) {
				gds.getNext(function(err, doc) {
					if(err) return done(err);
					next = doc;
					if(next === null) {
						return done();
					} else {
						results.push(next);
						return done();
					}
				});
			},
			function(err) {
				assert.equal(JSON.stringify(results), JSON.stringify(args.expected));
				if(args.done) {
					return args.done();
				}
			}
		);
	}else{
		if(args.throw) {
			assert.throws(function(){
				GroupDocumentSource.createFromJson(args.spec);
			});
		} else {
			assert.doesNotThrow(function(){
				var gds = GroupDocumentSource.createFromJson(args.spec);
			});
		}
	}
}


module.exports = {

	"GroupDocumentSource": {

		"constructor()": {

			// $group spec is not an object
			"should throw Error when constructing without args": function testConstructor(){
				assertExpectedResult({"throw":true});
			},

			// $group spec is not an object
			"should throw Error when $group spec is not an object": function testConstructor(){
				assertExpectedResult({spec:"Foo"});
			},

			// $group spec is an empty object
			"should throw Error when $group spec is an empty object": function testConstructor(){
				assertExpectedResult({spec:{}});
			},

			// $group _id is an empty object
			"should not throw when _id is an empty object": function advanceTest(){
				assertExpectedResult({spec:{_id:{}}, "throw":false});
			},

			// $group _id is specified as an invalid object expression
			"should throw error when _id is an invalid object expression": function testConstructor(){
				assertExpectedResult({
					spec:{_id:{$add:1, $and:1}},
				});
			},


			// $group with two _id specs
			//NOT Implemented can't do this in Javascript



			// $group _id is the empty string
			"should not throw when _id is an empty string": function advanceTest(){
				assertExpectedResult({spec:{_id:""}, "throw":false});
			},

			// $group _id is a string constant
			"should not throw when _id is a string constant": function advanceTest(){
				assertExpectedResult({spec:{_id:"abc"}, "throw":false});
			},

			// $group with _id set to an invalid field path
			"should throw when _id is an invalid field path": function advanceTest(){
				assertExpectedResult({spec:{_id:"$a.."}});
			},

			// $group _id is a numeric constant
			"should not throw when _id is a numeric constant": function advanceTest(){
				assertExpectedResult({spec:{_id:2}, "throw":false});
			},

			// $group _id is an array constant
			"should not throw when _id is an array constant": function advanceTest(){
				assertExpectedResult({spec:{_id:[1,2]}, "throw":false});
			},

			// $group _id is a regular expression (not supported)
			"should not throw when _id is a regex": function advanceTest(){
				assertExpectedResult({spec:{_id:/a/}, "throw":false});
			},

			// The name of an aggregate field is specified with a $ prefix
			"should throw when aggregate field spec is specified with $ prefix": function advanceTest(){
				assertExpectedResult({spec:{_id:1, $foo:{$sum:1}}});
			},

			// An aggregate field spec that is not an object
			"should throw when aggregate field spec is not an object": function advanceTest(){
				assertExpectedResult({spec:{_id:1, a:1}});
			},

			// An aggregate field spec that is not an object
			"should throw when aggregate field spec is an empty object": function advanceTest(){
				assertExpectedResult({spec:{_id:1, a:{}}});
			},

			// An aggregate field spec with an invalid accumulator operator
			"should throw when aggregate field spec is an invalid accumulator": function advanceTest(){
				assertExpectedResult({spec:{_id:1, a:{$bad:1}}});
			},

			// An aggregate field spec with an array argument
			"should throw when aggregate field spec with an array as an argument": function advanceTest(){
				assertExpectedResult({spec:{_id:1, a:{$sum:[]}}});
			},

			// Multiple accumulator operators for a field
			"should throw when aggregate field spec with multiple accumulators": function advanceTest(){
				assertExpectedResult({spec:{_id:1, a:{$sum:1, $push:1}}});
			}

		},

		"#getSourceName()": {

			"should return the correct source name; $group": function testSourceName(){
				var gds = new GroupDocumentSource({_id:{}});
				assert.strictEqual(gds.getSourceName(), "$group");
			}
		},

		"#getNext, #populate": {

			// Aggregation using duplicate field names is allowed currently
			// Note: Can't duplicate fields in javascript objects -- skipped

			// $group _id is computed from an object expression
			"should compute _id from an object expression": function testAdvance_ObjectExpression(){
				assertExpectedResult({
					docs: [{a:6}],
					spec: {_id:{z:"$a"}},
					expected: [{_id:{z:6}}]
				});
			},

			// $group _id is a field path expression
			"should compute _id from a field path expression": function testAdvance_FieldPathExpression(){
				assertExpectedResult({
					docs: [{a:5}],
					spec: {_id:"$a"},
					expected: [{_id:5}]
				});
			},

			// $group _id is a field path expression
			"should compute _id from a Date": function testAdvance_Date(){
				var d = new Date();
				assertExpectedResult({
					docs: [{a:d}],
					spec: {_id:"$a"},
					expected: [{_id:d}]
				});
			},

			// Aggregate the value of an object expression
			"should aggregate the value of an object expression": function testAdvance_ObjectExpression(){
				assertExpectedResult({
					docs: [{a:6}],
					spec: {_id:0, z:{$first:{x:"$a"}}},
					expected: [{_id:0, z:{x:6}}]
				});
			},

			// Aggregate the value of an operator expression
			"should aggregate the value of an operator expression": function testAdvance_OperatorExpression(){
				assertExpectedResult({
					docs: [{a:6}],
					spec: {_id:0, z:{$first:"$a"}},
					expected: [{_id:0, z:6}]
				});
			},

			// Aggregate the value of an operator expression
			"should aggregate the value of an operator expression with a null id": function testAdvance_Null(){
				assertExpectedResult({
					docs: [{a:6}],
					spec: {_id:null, z:{$first:"$a"}},
					expected: [{_id:null, z:6}]
				});
			},

			// A $group performed on a single document
			"should make one group with one values": function SingleDocument() {
				assertExpectedResult({
					docs: [{a:1}],
					spec: {_id:0, a:{$sum:"$a"}},
					expected: [{_id:0, a:1}]
				});
			},

			// A $group performed on two values for a single key
			"should make one group with two values": function TwoValuesSingleKey() {
				assertExpectedResult({
					docs: [{a:1}, {a:2}],
					spec: {_id:0, a:{$push:"$a"}},
					expected: [{_id:0, a:[1,2]}]
				});
			},

			// A $group performed on two values with one key each.
			"should make two groups with one value": function TwoValuesTwoKeys() {
				assertExpectedResult({
					docs: [{_id:0,a:1}, {_id:1,a:2}],
					spec: {_id:"$_id", a:{$push:"$a"}},
					expected: [{_id:0, a:[1]}, {_id:1, a:[2]}]
				});
			},

			// A $group performed on two values with two keys each.
			"should make two groups with two values": function FourValuesTwoKeys() {
				assertExpectedResult({
					docs: [{_id:0,a:1}, {_id:1,a:2}, {_id:0,a:3}, {_id:1,a:4}],
					spec: {_id:"$_id", a:{$push:"$a"}},
					expected: [{_id:0, a:[1, 3]}, {_id:1, a:[2, 4]}]
				});
			},

			// A $group performed on two values with two keys each and two accumulator operations.
			"should make two groups with two values with two accumulators": function FourValuesTwoKeysTwoAccumulators() {
				assertExpectedResult({
					docs: [{_id:0,a:1}, {_id:1,a:2}, {_id:0,a:3}, {_id:1,a:4}],
					spec: {_id:"$_id", list:{$push:"$a"}, sum:{$sum:{$divide:["$a", 2]}}},
					expected: [{_id:0, list:[1, 3], sum:2}, {_id:1, list:[2, 4], sum:3}]
				});
			},

			// Null and undefined _id values are grouped together.
			"should group null and undefined _id's together": function GroupNullUndefinedIds() {
				assertExpectedResult({
					docs: [{a:null, b:100}, {b:10}],
					spec: {_id:"$a", sum:{$sum:"$b"}},
					expected: [{_id:null, sum:110}]
				});
			},

			// A complex _id expression.
			"should group based on a complex id": function ComplexId() {
				assertExpectedResult({
					docs: [{a:"de", b:"ad", c:"beef", d:""}, {a:"d", b:"eadbe", c:"", d:"ef"}],
					spec: {_id:{$concat:["$a", "$b", "$c", "$d"]}},
					expected: [{_id:'deadbeef'}]
				});
			},

			// An undefined accumulator value is dropped.
			"should ignore undefined values during accumulation":function UndefinedAccumulatorValue() {
				assertExpectedResult({
					docs: [{}],
					spec: {_id:0, first:{$first:"$missing"}},
					expected: [{_id:0, first:null}]
				});
			}
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).grep(process.env.MOCHA_GREP || '').run(process.exit);
