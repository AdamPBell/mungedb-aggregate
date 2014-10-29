"use strict";
var assert = require("assert"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.ConstantExpression = {

	".constructor()": {

		"should accept one argument": function() {
			new ConstantExpression(5);
		},

		"should not accept 0 arguments": function() {
			assert.throws(function() {
				 new ConstantExpression();
			});
		},

		"should not accept 2 arguments": function() {
			assert.throws(function() {
				new ConstantExpression(1, 2);
			});
		},

	},

	".parse()": {

		"should create an expression from a json element": function testCreateFromBsonElement() {
			var idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expression = ConstantExpression.parse("foo", vps);
			assert.deepEqual("foo", expression.evaluate({}));
		},

	},

	".create()": {

		"should create an expression": function testCreate() {
			assert(ConstantExpression.create() instanceof ConstantExpression);
		},

		//SKIPPED: testCreateFronBsonElement

	},

	"#optimize()": {

		"should not optimize anything": function testOptimize() {
			var expr = new ConstantExpression(5);
			assert.strictEqual(expr, expr.optimize());
		},

	},

	"#addDependencies()": {

		"should return nothing": function testDependencies() {
			var expr = ConstantExpression.create(5),
				deps = {}; //TODO: new DepsTracker
			expr.addDependencies(deps);
			assert.strictEqual(deps.fields.length, 0);
			assert.strictEqual(deps.needWholeDocument, false);
			assert.strictEqual(deps.needTextScore, false);
		},

	},

	//TODO: AddToBsonObj

	//TODO: AddToBsonArray

	"#evaluate()": {

		"should do what comes natural with an int": function() {
			var c = 567;
			var expr = new ConstantExpression(c);
			assert.deepEqual(expr.evaluate(), c);
		},

		"should do what comes natural with a float": function() {
			var c = 567.123;
			var expr = new ConstantExpression(c);
			assert.deepEqual(expr.evaluate(), c);
		},

		"should do what comes natural with a String": function() {
			var c = "Quoth the raven";
			var expr = new ConstantExpression(c);
			assert.deepEqual(expr.evaluate(), c);
		},

		"should do what comes natural with a date": function() {
			var c = new Date();
			var expr = new ConstantExpression(c);
			assert.deepEqual(expr.evaluate(), c);
		},

	},

};
