"use strict";
var assert = require("assert"),
	Pipeline = require("../../../lib/pipeline/Pipeline"),
	DocumentSource = require('../../../lib/pipeline/documentSources/DocumentSource');


module.exports = {

	"Pipeline": {

		before: function () {

			Pipeline.stageDesc.$test = (function () {
				var klass = function TestDocumentSource(options, ctx) {
					base.call(this, ctx);

					this.shouldCoalesce = options.coalesce;
					this.coalesceWasCalled = false;
					this.optimizeWasCalled = false;

					this.current = 5;

				}, TestDocumentSource = klass, base = DocumentSource, proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});


				proto.coalesce = function () {
					this.coalesceWasCalled = true;
					var c = this.shouldCoalesce;//only coalesce with the first thing we find
					this.shouldCoalesce = false;
					return c;
				};

				proto.optimize = function () {
					this.optimizeWasCalled = true;
				};

				proto.eof = function () {
					return this.current < 0;
				};

				proto.advance = function () {
					this.current = this.current - 1;
					return !this.eof();
				};

				proto.getCurrent = function () {
					return this.current;
				};

				klass.createFromJson = function (options, ctx) {
					return new TestDocumentSource(options, ctx);
				};

				return klass;
			})().createFromJson;

		},

		"parseCommand": {

			"should throw Error if given non-objects in the array": function () {
				assert.throws(function () {
					Pipeline.parseCommand({pipeline: [5]});
				});
			},

			"should throw Error if given objects with more / less than one field": function () {
				assert.throws(function () {
					Pipeline.parseCommand({pipeline: [
						{}
					]});
					Pipeline.parseCommand({pipeline: [
						{a: 1, b: 2}
					]});
				});
			},

			"should throw Error on unknown document sources": function () {
				assert.throws(function () {
					Pipeline.parseCommand({pipeline: [
						{$foo: "$sdfdf"}
					]});
				});
			},

			"should swap $match and $sort if the $match immediately follows the $sort": function () {
				var p = Pipeline.parseCommand({pipeline: [
					{$sort: {"xyz": 1}},
					{$match: {}}
				]});
				assert.equal(p.sourceVector[0].constructor.matchName, "$match");
				assert.equal(p.sourceVector[1].constructor.sortName, "$sort");
			},

			"should attempt to coalesce all sources": function () {
				var p = Pipeline.parseCommand({pipeline: [
					{$test: {coalesce: false}},
					{$test: {coalesce: true}},
					{$test: {coalesce: false}},
					{$test: {coalesce: false}}
				]});
				assert.equal(p.sourceVector.length, 3);
				p.sourceVector.slice(0, -1).forEach(function (source) {
					assert.equal(source.coalesceWasCalled, true);
				});
				assert.equal(p.sourceVector[p.sourceVector.length - 1].coalesceWasCalled, false);
			},

			"should optimize all sources": function () {
				var p = Pipeline.parseCommand({pipeline: [
					{$test: {coalesce: false}},
					{$test: {coalesce: false}}
				]});
				p.sourceVector.forEach(function (source) {
					assert.equal(source.optimizeWasCalled, true);
				});
			}

		},

		"#run": {

			"should set the parent source for all sources in the pipeline except the first one": function (next) {
				var p = Pipeline.parseCommand({pipeline: [
					{$test: {coalesce: false}},
					{$test: {coalesce: false}},
					{$test: {coalesce: false}}
				]});
				p.run(new DocumentSource({}), function (err, results) {
					assert.equal(p.sourceVector[1].source, p.sourceVector[0]);
					assert.equal(p.sourceVector[2].source, p.sourceVector[1]);
					return next();
				});
			},

			"should iterate through sources and return resultant array": function (next) {
				var p = Pipeline.parseCommand({pipeline: [
					{$test: {coalesce: false}},
					{$test: {coalesce: false}},
					{$test: {coalesce: false}}
				]});
				p.run(new DocumentSource({}), function (err, results) {
					assert.deepEqual(results.result, [5, 4, 3, 2, 1, 0]); //see the test source for why this should be so
					return next();
				});
			},

			"should catch parse errors": function () {
				// The $foo part is invalid and causes a throw.
				assert.throws(function () {
					Pipeline.parseCommand({pipeline: [
						{$match: {$foo: {bar: "baz"}}}
					]});
				});
			},

			"should call callback with errors from pipeline components": function (next) {
				var p = Pipeline.parseCommand({pipeline: [
					{$match: {foo: {bar: "baz"}}}
				]});
				p.run(new DocumentSource({}), function (err, results) {
					assert(err instanceof Error);
					return next();
				})
			}
		}
	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).grep(process.env.MOCHA_GREP || '').run(process.exit);
