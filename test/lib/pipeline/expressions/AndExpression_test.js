"use strict";
var assert = require("assert"),
	Expression = require("../../../../lib/pipeline/expressions/Expression"),
	AndExpression = require("../../../../lib/pipeline/expressions/AndExpression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	utils = require("./utils"),
	constify = utils.constify,
	expressionToJson = utils.expressionToJson;

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

var TestBase = function TestBase(overrides) {
		//NOTE: DEVIATION FROM MONGO: using this base class to make things easier to initialize
		for (var key in overrides)
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

exports.AndExpression = {

	"constructor()": {

		"should construct instance": function() {
			assert(new AndExpression() instanceof AndExpression);
			assert(new AndExpression() instanceof Expression);
		},

		"should error if given args": function() {
			assert.throws(function() {
				new AndExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $and": function() {
			assert.equal(new AndExpression().getOpName(), "$and");
		}

	},

	"#evaluate()": {

		"should return true if no operands": function testNoOperands() {
			/** $and without operands. */
			new ExpectedResultBase({
				spec: {$and:[]},
				expectedResult: true,
			}).run();
		},

		"should return true if given true": function testTrue() {
			/** $and passed 'true'. */
			new ExpectedResultBase({
				spec: {$and:[true]},
				expectedResult: true,
			}).run();
		},

		"should return false if given false": function testFalse() {
			/** $and passed 'false'. */
			new ExpectedResultBase({
				spec: {$and:[false]},
				expectedResult: false,
			}).run();
		},

		"should return true if given true and true": function testTrueTrue() {
			/** $and passed 'true', 'true'. */
			new ExpectedResultBase({
				spec: {$and:[true, true]},
				expectedResult: true,
			}).run();
		},

		"should return false if given true and false": function testTrueFalse() {
			/** $and passed 'true', 'false'. */
			new ExpectedResultBase({
				spec: {$and:[true, false]},
				expectedResult: false,
			}).run();
		},

		"should return false if given false and true": function testFalseTrue() {
			/** $and passed 'false', 'true'. */
			new ExpectedResultBase({
				spec: {$and:[false, true]},
				expectedResult: false,
			}).run();
		},

		"should return false if given false and false": function testFalseFalse() {
			/** $and passed 'false', 'false'. */
			new ExpectedResultBase({
				spec: {$and:[false, false]},
				expectedResult: false,
			}).run();
		},

		"should return true if given true and true and true": function testTrueTrueTrue() {
			/** $and passed 'true', 'true', 'true'. */
			new ExpectedResultBase({
				spec: {$and:[true, true, true]},
				expectedResult: true,
			}).run();
		},

		"should return false if given true and true and false": function testTrueTrueFalse() {
			/** $and passed 'true', 'true', 'false'. */
			new ExpectedResultBase({
				spec: {$and:[true, true, false]},
				expectedResult: false,
			}).run();
		},

		"should return false if given 0 and 1": function testZeroOne() {
			/** $and passed '0', '1'. */
			new ExpectedResultBase({
				spec: {$and:[0, 1]},
				expectedResult: false,
			}).run();
		},

		"should return true if given 1 and 2": function testOneTwo() {
			/** $and passed '1', '2'. */
			new ExpectedResultBase({
				spec: {$and:[1, 2]},
				expectedResult: true,
			}).run();
		},

		"should return true if given a field path to a truthy value": function testFieldPath() {
			/** $and passed a field path. */
			new ExpectedResultBase({
				spec: {$and:["$a"]},
				expectedResult: true,
			}).run();
		},

	},

	"#optimize()": {

		"should optimize a constant expression": function OptimizeConstantExpression() {
			/** A constant expression is optimized to a constant. */
			new OptimizeBase({
				spec: {$and:[1]},
				expectedOptimized: {$const:true},
			}).run();
		},

		"should not optimize a non constant": function NonConstant() {
			/** A non constant expression is not optimized. */
			new NoOptimizeBase({
				spec: {$and:["$a"]},
			}).run();
		},

		"should optimize if begins with a single truthy constant": function ConstantNonConstantTrue() {
			/** An expression beginning with a single constant is optimized. */
			new OptimizeBase({
				spec: {$and:[1,"$a"]},
				expectedOptimized: {$and:["$a"]},
			}).run();
			// note: using $and as serialization of ExpressionCoerceToBool rather than ExpressionAnd
		},

		"should optimize if begins with a single falsey constant": function ConstantNonConstantFalse() {
			new OptimizeBase({
				spec: {$and:[0,"$a"]},
				expectedOptimized: {$const:false},
			}).run();
		},

		"should optimize away any truthy constant expressions": function NonConstantOne() {
			/** An expression with a field path and '1'. */
			new OptimizeBase({
				spec: {$and:["$a",1]},
				expectedOptimized: {$and:["$a"]}
			}).run();
		},

		"should optimize to false if contains non-truthy constant expressions": function NonConstantZero() {
			/** An expression with a field path and '0'. */
			new OptimizeBase({
				spec: {$and:["$a",0]},
				expectedOptimized: {$const:false},
			}).run();
		},

		"should optimize away any truthy constant expressions (and 2 field paths)": function NonConstantNonConstantOne() {
			/** An expression with two field paths and '1'. */
			new OptimizeBase({
				spec: {$and:["$a","$b",1]},
				expectedOptimized: {$and:["$a","$b"]}
			}).run();
		},

		"should optimize to false if contains non-truthy constant expressions (and 2 field paths)": function NonConstantNonConstantZero() {
			/** An expression with two field paths and '0'. */
			new OptimizeBase({
				spec: {$and:["$a","$b",0]},
				expectedOptimized: {$const:false},
			}).run();
		},

		"should optimize to false if [0,1,'$a']": function ZeroOneNonConstant() {
			/** An expression with '0', '1', and a field path. */
			new OptimizeBase({
				spec: {$and:[0,1,"$a"]},
				expectedOptimized: {$const:false},
			}).run();
		},

		"should optimize to '$a' if [1,1,'$a']": function OneOneNonConstant() {
			/** An expression with '1', '1', and a field path. */
			new OptimizeBase({
				spec: {$and:[1,1,"$a"]},
				expectedOptimized: {$and:["$a"]},
			}).run();
		},

		"should optimize away nested truthy $and": function Nested() {
			/** Nested $and expressions. */
			new OptimizeBase({
				spec: {$and:[1, {$and:[1]}, "$a", "$b"]},
				expectedOptimized: {$and:["$a","$b"]},
			}).run();
		},

		"should optimize to false if nested falsey $and": function NestedZero() {
			/** Nested $and expressions containing a nested value evaluating to false. */
			new OptimizeBase({
				spec: {$and:[1, {$and:[ {$and:[0]} ]}, "$a", "$b"]},
				expectedOptimized: {$const:false},
			}).run();
		},

	},

};
