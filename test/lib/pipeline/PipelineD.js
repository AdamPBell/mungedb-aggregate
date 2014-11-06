"use strict";
var assert = require("assert"),
	Pipeline = require("../../../lib/pipeline/Pipeline"),
	PipelineD = require("../../../lib/pipeline/PipelineD"),
	DocumentSource = require('../../../lib/pipeline/documentSources/DocumentSource'),
	CursorDocumentSource = require('../../../lib/pipeline/documentSources/CursorDocumentSource');


module.exports = {

	"PipelineD": {

		"prepareCursorSource": {

			"should place a CursorDocumentSource in pipeline": function () {
				var p = Pipeline.parseCommand({pipeline:[{$match:{a:true}}], aggregate:[]}),
					cs = PipelineD.prepareCursorSource(p, {ns:[1,2,3,4,5]});
				assert.equal(p.sources[0].constructor, CursorDocumentSource);
			},

			"should get projection from all sources": function () {
				var p = Pipeline.parseCommand({pipeline:[{$project:{a:"$x"}}], aggregate:[]}),
					cs = PipelineD.prepareCursorSource(p, {ns:[1,2,3,4,5]});
				assert.deepEqual(p.sources[0]._projection, {x:1, _id:1});
				assert.deepEqual(p.sources[0]._dependencies, {_fields:{_id:true, x:true}});
			},

			"should get projection's deps": function () {
				var cmdObj = {
					aggregate: [],
					pipeline: [
						{$match:{
							x:{$exists:true},
							y:{$exists:false}
						}},
						{$project:{
							a:"$a.b.c",
							b:"$d",
							c:"$e.f.g"
						}},
						{$group:{
							_id:"$a",
							x:{$push:"b"}
						}}
					]
				};
				var p = Pipeline.parseCommand(cmdObj),
					cs = PipelineD.prepareCursorSource(p, {ns:[1,2,3,4,5]});
				assert.deepEqual(p.sources[0]._projection, {'a.b.c': 1, d: 1, 'e.f.g': 1, _id: 1});
				assert.deepEqual(p.sources[0]._dependencies, {"_fields":{"_id":true,"a":{"b":{"c":true}},"d":true,"e":{"f":{"g":true}}}});
			},
			"should get group's deps": function(){
				var cmdObj = {
					aggregate: [],
					pipeline: [
						{$match:{
							x:{$exists:true},
							y:{$exists:false}
						}},
						{$group:{
							_id:"$a",
							x:{$push:"$b"},
							y:{$addToSet:"$x.y.z"},
							z:{$sum:"$x.y.z.w"}
						}},
						{$project:{
							a:"$a.b.c",
							b:"$d",
							c:"$e.f.g"
						}}
					]
				};
				var p = Pipeline.parseCommand(cmdObj),
					cs = PipelineD.prepareCursorSource(p, {ns:[1,2,3,4,5]});
				assert.equal(JSON.stringify(p.sources[0]._projection), JSON.stringify({ a: 1, b: 1, 'x.y.z': 1, _id: 0 }));
				assert.deepEqual(p.sources[0]._dependencies, {"_fields":{"a":true,"b":true,"x":{"y":{"z":true}}}});
			},
			"should set the queryObj on the Cursor": function(){
				var cmdObj = {
					aggregate: [],
					pipeline: [
						{$match:{
							x:{$exists:true},
							y:{$exists:false}
						}}
					]
				};
				var p = Pipeline.parseCommand(cmdObj),
					cs = PipelineD.prepareCursorSource(p, {ns:[1,2,3,4,5]});
				assert.deepEqual(p.sources[0]._query, {x:{$exists: true}, y:{$exists:false}});
			},
			"should set the sort on the Cursor": function(){
				var cmdObj = {
					aggregate: [],
					pipeline: [
						{$sort:{
							x:1,
							y:-1
						}}
					]
				};
				var p = Pipeline.parseCommand(cmdObj),
					cs = PipelineD.prepareCursorSource(p, {ns:[1,2,3,4,5]});
				assert.deepEqual(p.sources[0]._sort, {x:1, y:-1});
			},
			"should set the sort on the Cursor if there is a match first": function(){
				var cmdObj = {
					aggregate: [],
					pipeline: [
						{$match:{
							x:{$exists:true},
							y:{$exists:false}
						}},
						{$sort:{
							x:1,
							y:-1
						}}
					]
				};
				var p = Pipeline.parseCommand(cmdObj),
					cs = PipelineD.prepareCursorSource(p, {ns:[1,2,3,4,5]});
				assert.deepEqual(p.sources[0]._sort, {x:1, y:-1});
			},
			"should coalesce the Cursor with the rest of the pipeline": function(){
				var cmdObj = {
					aggregate: [],
					pipeline: [
						{$limit:1}
					]
				};
				var p = Pipeline.parseCommand(cmdObj),
					cs = PipelineD.prepareCursorSource(p, {ns:[1,2,3,4,5]});
				assert.equal(p.sources[0].getLimit(), 1);
				assert.equal(p.sources.length, 1);
			},
		}
	}

};


if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).grep(process.env.MOCHA_GREP || '').run(process.exit);
