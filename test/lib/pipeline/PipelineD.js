"use strict";
var assert = require("assert"),
	Pipeline = require("../../../lib/pipeline/Pipeline"),
	PipelineD = require("../../../lib/pipeline/PipelineD"),
	DocumentSource = require('../../../lib/pipeline/documentSources/DocumentSource'),
	CursorDocumentSource = require('../../../lib/pipeline/documentSources/CursorDocumentSource');


module.exports = {

	"PipelineD": {

		before: function(){

			Pipeline.stageDesc.$test = (function(){

				var klass = function TestDocumentSource(options, ctx){
					base.call(this, ctx);

					this.shouldCoalesce = options.coalesce;
					this.coalesceWasCalled = false;
					this.optimizeWasCalled = false;
					this.resetWasCalled = false;

					this.current = 5;
				}, TestDocumentSource = klass, base = DocumentSource, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

				proto.coalesce = function(){
					this.coalesceWasCalled = true;
					var c = this.shouldCoalesce;//only coalesce with the first thing we find
					this.shouldCoalesce = false;
					return c;
				};

				proto.optimize = function(){
					this.optimizeWasCalled = true;
				};

				proto.eof = function(){
					return this.current < 0;
				};

				proto.advance = function(){
					this.current = this.current - 1;
					return !this.eof();
				};

				proto.getCurrent = function(){
					return this.current;
				};

				proto.reset = function(){
					this.resetWasCalled = true;
				};

				proto.getDependencies = function(deps){
					if (!deps.testDep){
						deps.testDep = 1;
						return DocumentSource.GetDepsReturn.EXHAUSTIVE;
					}
					return DocumentSource.GetDepsReturn.SEE_NEXT;
				};

				klass.createFromJson = function(options, ctx){
					return new TestDocumentSource(options, ctx);
				};

				return klass;
			})().createFromJson;

		},

		"prepareCursorSource": {

			"should place a CursorDocumentSource in pipeline": function () {
				var p = Pipeline.parseCommand({pipeline:[{$test:{coalesce:false}}, {$test:{coalesce:false}}], aggregate:[]}),
					cs = PipelineD.prepareCursorSource(p, {ns:[1,2,3,4,5]});
				assert.equal(p.sources[0].constructor, CursorDocumentSource);
			},

			"should get projection from all sources": function () {
				var p = Pipeline.parseCommand({pipeline:[{$test:{coalesce:false}}, {$test:{coalesce:false}}], aggregate:[]}),
					cs = PipelineD.prepareCursorSource(p, {ns:[1,2,3,4,5]});
				assert.deepEqual(p.sources[0]._projection, {"_id":0,"testDep":1});
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
				assert.equal(JSON.stringify(p.sources[0]._projection), JSON.stringify({'a.b.c': 1, d: 1, 'e.f.g': 1, _id: 1}));
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
				assert.equal(JSON.stringify(p.sources[0]._projection), JSON.stringify({ _id: 0, a: 1, b: 1, 'x.y.z': 1 }));
			}
		}
	}

};


if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).grep(process.env.MOCHA_GREP || '').run(process.exit);
