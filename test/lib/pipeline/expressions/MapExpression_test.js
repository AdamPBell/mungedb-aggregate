"use strict";
var assert = require("assert"),
	MapExpression = require("../../../../lib/pipeline/expressions/MapExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression"),
	AddExpression = require("../../../../lib/pipeline/expressions/AddExpression"), // jshint ignore:line
	IfNullExpression = require("../../../../lib/pipeline/expressions/IfNullExpression"), // jshint ignore:line
	Variables = require("../../../../lib/pipeline/expressions/Variables"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	DepsTracker = require("../../../../lib/pipeline/DepsTracker"),
	utils = require("./utils"),
	constify = utils.constify,
	expressionToJson = utils.expressionToJson;

// Mocha one-liner to make these tests self-hosted
if (!module.parent)return(require.cache[__filename] = null, (new (require("mocha"))({ui: "exports", reporter: "spec", grep: process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.MapExpression = {

	"constructor()": {

		"should accept 4 arguments": function () {
			new MapExpression(1, 2, 3, 4);
		},

		"should accept only 4 arguments": function () {
			assert.throws(function () { new MapExpression(); });
			assert.throws(function () { new MapExpression(1); });
			assert.throws(function () { new MapExpression(1, 2); });
			assert.throws(function () { new MapExpression(1, 2, 3); });
			assert.throws(function () { new MapExpression(1, 2, 3, 4, 5); });
		},

	},

	"#optimize()": {

		"should optimize both $map.input and $map.in": function() {
			var spec = {$map:{
					input: {$ifNull:[null, {$const:[1,2,3]}]},
					as: "i",
					in: {$add:["$$i","$$i",1,2]},
				}},
				idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand(spec, vps),
				optimized = expr.optimize();
			assert.strictEqual(optimized, expr, "should be same reference");
			assert.deepEqual(expressionToJson(optimized._input), {$const:[1,2,3]});
			assert.deepEqual(expressionToJson(optimized._each), constify({$add:["$$i","$$i",1,2]}));
		},

	},

	"#serialize()": {

		"should serialize to consistent order": function() {
			var spec = {$map:{
					as: "i",
					in: {$add:["$$i","$$i"]},
					input: {$const:[1,2,3]},
				}},
				expected = {$map:{
					input: {$const:[1,2,3]},
					as: "i",
					in: {$add:["$$i","$$i"]},
				}},
				idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand(spec, vps);
			assert.deepEqual(expressionToJson(expr), expected);
		},

	},

	"#evaluate()": {

		"should be able to map over a simple array": function() {
			var spec = {$map:{
					input: {$const:[1,2,3]},
					as: "i",
					in: {$add:["$$i","$$i"]},
				}},
				idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand(spec, vps),
				vars = new Variables(1, {}); // must set numVars (usually handled by doc src)
			assert.deepEqual(expr.evaluate(vars), [2, 4, 6]);
		},

	},

	"#addDependencies()": {

		"should add dependencies to both $map.input and $map.in": function () {
			var spec = {$map:{
					input: "$inputArray",
					as: "i",
					in: {$add:["$$i","$someConst"]},
				}},
				idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand(spec, vps),
				deps = new DepsTracker();
			expr.addDependencies(deps);
			assert.strictEqual(Object.keys(deps.fields).length, 2);
			assert.strictEqual("inputArray" in deps.fields, true);
			assert.strictEqual("someConst" in deps.fields, true);
			assert.strictEqual(deps.needWholeDocument, false);
			assert.strictEqual(deps.needTextScore, false);
		},

	},

};
