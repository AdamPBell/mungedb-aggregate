"use strict";
var assert = require("assert"),
	aggregate = require("../../");


// Utility to test the various use cases of `aggregate`
function testAggregate(opts){

	// SYNC: test one-off usage
	var results = aggregate(opts.pipeline, opts.inputs);
	assert.equal(JSON.stringify(results), JSON.stringify(opts.expected));

	// SYNC: test reusable aggregator functionality
	var aggregator = aggregate(opts.pipeline);
	results = aggregator(opts.inputs);
	assert.equal(JSON.stringify(results), JSON.stringify(opts.expected));

	// SYNC: test that it is actually reusable
	results = aggregator(opts.inputs);
	assert.equal(JSON.stringify(results), JSON.stringify(opts.expected), "Reuse of aggregator should yield the same results!");

	// ASYNC: test one-off usage
	aggregate(opts.pipeline, opts.inputs, function(err, results){
		assert.ifError(err);
		assert.equal(JSON.stringify(results), JSON.stringify(opts.expected));

		// ASYNC: test reusable aggregator functionality
		var aggregator = aggregate(opts.pipeline);
		aggregator(opts.inputs, function(err, results){
			assert.ifError(err);
			assert.equal(JSON.stringify(results), JSON.stringify(opts.expected));

			// ASYNC: test that it is actually reusable
			aggregator(opts.inputs, function(err, results){
				assert.ifError(err);
				assert.equal(JSON.stringify(results), JSON.stringify(opts.expected), "Reuse of aggregator should yield the same results!");

				// success!
				return opts.next();
			});

		});

	});
}


module.exports = {

	"aggregate": {

		"should be able to use an empty pipeline (no-op)": function(next){
			testAggregate({
				inputs: [1, 2, 3],
				pipeline: [],
				expected: [1, 2, 3],
				next: next
			});
		},


		"should be able to use a $limit operator": function(next){
			testAggregate({
				inputs: [{_id:0}, {_id:1}, {_id:2}, {_id:3}, {_id:4}, {_id:5}],
				pipeline: [{$limit:2}],
				expected: [{_id:0}, {_id:1}],
				next: next
			});
		},

		"should be able to use a $match operator": function(next){
			testAggregate({
				inputs: [{_id:0, e:1}, {_id:1, e:0}, {_id:2, e:1}, {_id:3, e:0}, {_id:4, e:1}, {_id:5, e:0}],
				pipeline: [{$match:{e:1}}],
				expected: [{_id:0, e:1}, {_id:2, e:1}, {_id:4, e:1}],
				next: next
			});
		},

		"should be able to use a $skip operator": function(next){
			testAggregate({
				inputs: [{_id:0}, {_id:1}, {_id:2}, {_id:3}, {_id:4}, {_id:5}],
				pipeline: [{$skip:2}, {$skip:1}],	//testing w/ 2 ensures independent state variables
				expected: [{_id:3}, {_id:4}, {_id:5}],
				next: next
			});
		},

		"should be able to use a $skip and then a $limit operator together in the same pipeline": function(next){
			testAggregate({
				inputs: [{_id:0, e:1}, {_id:1, e:0}, {_id:2, e:1}, {_id:3, e:0}, {_id:4, e:1}, {_id:5, e:0}],
				pipeline: [{$skip:2}, {$limit:1}],
				expected: [{_id:2, e:1}],
				next: next
			});
		},

		"should be able to construct an instance with $unwind operators properly": function(next){
			testAggregate({
				inputs: [
					{_id:0, nodes:[
						{one:[11], two:[2,2]},
						{one:[1,1], two:[22]}
					]},
					{_id:1, nodes:[
						{two:[22], three:[333]},
						{one:[1], three:[3,3,3]}
					]}
				],
				pipeline: [{$unwind:"$nodes"}, {$unwind:"$nodes.two"}],
				expected: [
					{_id:0,nodes:{one:[11],two:2}},
					{_id:0,nodes:{one:[11],two:2}},
					{_id:0,nodes:{one:[1,1],two:22}},
					{_id:1,nodes:{two:22,three:[333]}}
				],
				next: next
			});
		},

		"should be able to use a $project operator": function(next){
			testAggregate({
				inputs: [{_id:0, e:1, f:23}, {_id:2, e:2, g:34}, {_id:4, e:3}],
				pipeline: [
					{$project:{
						e:1,
						a:{$add:["$e", "$e"]},
						b:{$cond:[{$eq:["$e", 2]}, "two", "not two"]}
						//TODO: high level test of all other expression operators
					}}
				],
				expected: [{_id:0, e:1, a:2, b:"not two"}, {_id:2, e:2, a:4, b:"two"}, {_id:4, e:3, a:6, b:"not two"}],
				next: next
			});
		},


		"should be able to use a $project operator to exclude the _id field": function(next){
			testAggregate({
				inputs: [{_id:0, e:1, f:23}, {_id:2, e:2, g:34}, {_id:4, e:3}],
				pipeline: [
					{$project:{
						_id:0,
						e:1
						//TODO: high level test of all other expression operators
					}}
				],
				expected: [{e:1}, {e:2}, {e:3}],
				next: next
			});
		},

		"should be able to construct an instance with $sort operators properly (ascending)": function(next){
			testAggregate({
				inputs: [
					{_id:3.14159}, {_id:-273.15},
					{_id:42}, {_id:11}, {_id:1},
					{_id:null}, {_id:NaN}
				],
				pipeline: [{$sort:{_id:1}}],
				expected: [
					{_id:null}, {_id:NaN},
					{_id:-273.15}, {_id:1}, {_id:3.14159}, {_id:11}, {_id:42}
				],
				next: next
			});
		},

		"should be able to construct an instance with $group operators properly": function(next){
			testAggregate({
				inputs: [
					{_id:0, a:1},
					{_id:0, a:2},
					{_id:0, a:3},
					{_id:0, a:4},
					{_id:0, a:1.5},
					{_id:0, a:null},
					{_id:1, b:"a"},
					{_id:1, b:"b"},
					{_id:1, b:"b"},
					{_id:1, b:"c"}
				],
				pipeline:[
					{$group:{
						_id:"$_id",
						sum_a:{$sum:"$a"},
						//min_a:{$min:"$a"}, //this is busted in this version of mongo
						max_a:{$max:"$a"},
						avg_a:{$avg:"$a"},
						first_b:{$first:"$b"},
						last_b:{$last:"$b"},
						addToSet_b:{$addToSet:"$b"},
						push_b:{$push:"$b"}
					}}
				],
				expected: [
					{
						_id:0,
						sum_a:11.5,
						//min_a:1,
						max_a:4,
						avg_a:2.3,
						first_b:undefined,
						last_b:undefined,
						addToSet_b:[],
						push_b:[]
					},
					{
						_id:1,
						sum_a:0,
						//min_a:null,
						max_a:undefined,
						avg_a:0,
						first_b:"a",
						last_b:"c",
						addToSet_b:["a", "b", "c"],
						push_b:["a", "b", "b", "c"]
					}
				],
				next: next
			});
		},

		"should be able to construct an instance with $group using concat": function(next){
			testAggregate({
				inputs: [
					{_id:0, a:null},
					{_id:1, a:"a"},
					{_id:1, a:"b"},
					{_id:1, a:"b"},
					{_id:1, a:"c"}
				],
				pipeline: [
					{$group:{
						_id:{$concat:["$a"]}
					}}
				],
				expected: [
					{_id: null},
					{_id: "a"},
					{_id: "b"},
					{_id: "c"}
				],
				next: next
			});
		},

		"should be able to successfully use comparisions of objects to nulls without throwing an exception": function(next){
			testAggregate({
				inputs: [
					{
						cond:{$or:[
							{$eq:["$server","Starmetal.demo.com"]},
						]},
						value:"PII"
					},
					{
						cond:{$or:[
							{$eq:["$server","Specium.demo.com"]},
							{$eq:["$server","Germanium.demo.com"]},
							{$eq:["$server","Runite.demo.com"]}
						]},
						value:"PI"
					},
					{
						cond:{$or:[
							{$eq:["$server","Primal.demo.com"]}
						]},
						value:"Confidential"
					},
					{
						cond:{$or:[
							{$eq:["$server","Polarite.demo.com"]},
							{$eq:["$server","Ryanium.demo.com"]}
						]},
						value:"Proprietary"
					},
					{
						cond:{$or:[
							{$eq:["$server","Phazon.demo.com"]}
						]},
						value:"PHI"
					},
					{
						cond:null,
						value:"Authorized"
					}
				],
				pipeline: [
					{$skip:1},
					{$limit:1},
					{$project:{
						retValue:{$cond:[
							{$ne:["$cond", null]},
							null,
							"$value"
						]}
					}}
				],
				expected: [{"retValue":null}],
				next: next
			});
		},

		"should be able to successfully compare a null to a null": function(next){
			testAggregate({
				inputs: [
					{
						cond:null,
						value:"Authorized"
					}
				],
				pipeline: [
					{$project:{
						retValue:{$cond:[
							{$eq:["$cond", null]},
							"$value",
							null
						]}
					}}
				],
				expected: [{"retValue":"Authorized"}],
				next: next
			});
		},
	}

};


if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).grep(process.env.MOCHA_GREP || '').run(process.exit);
