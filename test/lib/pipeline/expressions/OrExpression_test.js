"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	Expression = require("../../../../lib/pipeline/expressions/Expression"),
	OrExpression = require("../../../../lib/pipeline/expressions/OrExpression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	utils = require("./utils"),
	constify = utils.constify,
	expressionToJson = utils.expressionToJson;

var TestBase = function TestBase(overrides) {
		//NOTE: DEVIATION FROM MONGO: using this base class to make things easier to initialize
		for (var key in overrides) //jshint ignore:line
			this[key] = overrides[key];
	},
	ExpectedResultBase = (function() {
		var klass = function ExpectedResultBase() {
			base.apply(this, arguments);
		}, base = TestBase, proto = klass.prototype = Object.create(base.prototype);
		proto.run = function() {
			var specElement = this.spec instanceof Function ? this.spec() : this.spec,
				idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand(specElement, vps);
			assert.deepEqual(constify(specElement), expressionToJson(expr));
			var expectedResult = this.expectedResult instanceof Function ? this.expectedResult() : this.expectedResult;
			assert.strictEqual(expectedResult, expr.evaluate({a:1}));
			var optimized = expr.optimize();
			assert.strictEqual(expectedResult, optimized.evaluate({a:1}));
		};
		return klass;
	})(),
	OptimizeBase = (function() {
		var klass = function OptimizeBase() {
			base.apply(this, arguments);
		}, base = TestBase, proto = klass.prototype = Object.create(base.prototype);
		proto.run = function() {
			var specElement = this.spec instanceof Function ? this.spec() : this.spec,
				idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand(specElement, vps);
			assert.deepEqual(constify(specElement), expressionToJson(expr));
			var optimized = expr.optimize(),
				expectedOptimized = this.expectedOptimized instanceof Function ? this.expectedOptimized() : this.expectedOptimized;
			assert.deepEqual(expectedOptimized, expressionToJson(optimized));
		};
		return klass;
	})(),
	NoOptimizeBase = (function() {
		var klass = function NoOptimizeBase() {
			base.apply(this, arguments);
		}, base = OptimizeBase, proto = klass.prototype = Object.create(base.prototype);
		proto.expectedOptimized = function() {
			return constify(this.spec instanceof Function ? this.spec() : this.spec);
		};
		return klass;
	})();

exports.OrExpression = {

	"constructor()": {

		"should construct instance": function() {
			assert(new OrExpression() instanceof OrExpression);
			assert(new OrExpression() instanceof Expression);
		},

		"should error if given args": function() {
			assert.throws(function() {
				new OrExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $or": function(){
			assert.equal(new OrExpression().getOpName(), "$or");
		}

	},

	"#evaluate()": {

		"should return false if no operands": function testNoOperands(){
			/** $or without operands. */
			new ExpectedResultBase({
				spec: {$or:[]},
				expectedResult: false,
			}).run();
		},

		"should return true if given true": function testTrue(){
			/** $or passed 'true'. */
			new ExpectedResultBase({
				spec: {$or:[true]},
				expectedResult: true,
			}).run();
		},

		"should return false if given false": function testFalse(){
			/** $or passed 'false'. */
			new ExpectedResultBase({
				spec: {$or:[false]},
				expectedResult: false,
			}).run();
		},

		"should return true if given true and true": function testTrueTrue(){
			/** $or passed 'true', 'true'. */
			new ExpectedResultBase({
				spec: {$or:[true, true]},
				expectedResult: true,
			}).run();
		},

		"should return true if given true and false": function testTrueFalse(){
			/** $or passed 'true', 'false'. */
			new ExpectedResultBase({
				spec: {$or:[true, false]},
				expectedResult: true,
			}).run();
		},

		"should return true if given false and true": function testFalseTrue(){
			/** $or passed 'false', 'true'. */
			new ExpectedResultBase({
				spec: {$or:[false, true]},
				expectedResult: true,
			}).run();
		},

		"should return false if given false and false": function testFalseFalse(){
			/** $or passed 'false', 'false'. */
			new ExpectedResultBase({
				spec: {$or:[false, false]},
				expectedResult: false,
			}).run();
		},

		"should return false if given false and false and false": function testFalseFalseFalse(){
			/** $or passed 'false', 'false', 'false'. */
			new ExpectedResultBase({
				spec: {$or:[false, false, false]},
				expectedResult: false,
			}).run();
		},

		"should return true if given false and false and true": function testFalseFalseTrue(){
			/** $or passed 'false', 'false', 'true'. */
			new ExpectedResultBase({
				spec: {$or:[false, false, true]},
				expectedResult: true,
			}).run();
		},

		"should return true if given 0 and 1": function testZeroOne(){
			/** $or passed '0', '1'. */
			new ExpectedResultBase({
				spec: {$or:[0, 1]},
				expectedResult: true,
			}).run();
		},

		"should return false if given 0 and false": function testZeroFalse(){
			/** $or passed '0', 'false'. */
			new ExpectedResultBase({
				spec: {$or:[0, false]},
				expectedResult: false,
			}).run();
		},

		"should return true if given a field path to a truthy value": function testFieldPath(){
			/** $or passed a field path. */
			new ExpectedResultBase({
				spec: {$or:["$a"]},
				expectedResult: true,
			}).run();
		},

	},

	"#optimize()": {

		"should optimize a constant expression": function testOptimizeConstantExpression() {
			/** A constant expression is optimized to a constant. */
			new OptimizeBase({
				spec: {$or:[1]},
				expectedOptimized: {$const:true},
			}).run();
		},

		"should not optimize a non constant": function testNonConstant() {
			/** A non constant expression is not optimized. */
			new NoOptimizeBase({
				spec: {$or:["$a"]},
			}).run();
		},

		"should optimize truthy constant and truthy expression": function testConstantNonConstantTrue() {
			/** An expression beginning with a single constant is optimized. */
			new OptimizeBase({
				spec: {$or:[1,"$a"]},
				expectedOptimized: {$const:true},
			}).run();
		},

		"should optimize falsy constant and truthy expression": function testConstantNonConstantFalse() {
			/** An expression beginning with a single constant is optimized. */
			new OptimizeBase({
				spec: {$or:[0,"$a"]},
				expectedOptimized: {$and:["$a"]},
			}).run();
			// note: using $and as serialization of ExpressionCoerceToBool rather than ExpressionAnd
		},

		"should optimize truthy expression and truthy constant": function testNonConstantOne() {
			/** An expression with a field path and '1'. */
			new OptimizeBase({
				spec: {$or:["$a", 1]},
				expectedOptimized: {$const:true},
			}).run();
		},

		"should optimize truthy expression and falsy constant": function testNonConstantZero() {
			/** An expression with a field path and '0'. */
			new OptimizeBase({
				spec: {$or:["$a", 0]},
				expectedOptimized: {$and:["$a"]},
			}).run();
		},

		"should optimize truthy expression, falsy expression, and truthy constant": function testNonConstantNonConstantOne() {
			/** An expression with two field paths and '1'. */
			new OptimizeBase({
				spec: {$or:["$a","$b",1]},
				expectedOptimized: {$const:true},
			}).run();
		},

		"should optimize truthy expression, falsy expression, and falsy constant": function testNonConstantNonConstantZero() {
			/** An expression with two field paths and '0'. */
			new OptimizeBase({
				spec: {$or:["$a","$b",0]},
				expectedOptimized: {$or:["$a", "$b"]},
			}).run();
		},

		"should optimize to true if [0,1,'$a']": function testZeroOneNonConstant() {
			/** An expression with '0', '1', and a field path. */
			new OptimizeBase({
				spec: {$or:[0,1,"$a"]},
				expectedOptimized: {$const:true},
			}).run();
		},

		"should optimize to {$and:'$a'} if [0,0,'$a']": function testZeroZeroNonConstant() {
			/** An expression with '0', '0', and a field path. */
			new OptimizeBase({
				spec: {$or:[0,0,"$a"]},
				expectedOptimized: {$and:["$a"]},
			}).run();
		},

		"should optimize away nested falsey $or expressions": function testNested() {
			/** Nested $or expressions. */
			new OptimizeBase({
				spec: {$or:[0, {$or:[0]}, "$a", "$b"]},
				expectedOptimized: {$or: ["$a", "$b"]},
			}).run();
		},

		"should optimize to tru if nested truthy $or expressions": function testNestedOne() {
			/** Nested $or expressions containing a nested value evaluating to false. */
			new OptimizeBase({
				spec: {$or:[0, {$or:[ {$or:[1]} ]}, "$a", "$b"]},
				expectedOptimized: {$const:true},
			}).run();
		},

	},

};
