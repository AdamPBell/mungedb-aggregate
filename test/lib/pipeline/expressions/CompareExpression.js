"use strict";
var assert = require("assert"),
	pipeline = require("../../../../lib/pipeline"),
	expressions = pipeline.expressions,
	Expression = expressions.Expression,
	CompareExpression = require("../../../../lib/pipeline/expressions/CompareExpression"),
	VariablesParseState = require("../../../../Lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../Lib/pipeline/expressions/VariablesIdGenerator"),
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
	OptimizeBase = (function() {
		var klass = function OptimizeBase() {
				base.apply(this, arguments);
			},
			base = TestBase,
			proto = klass.prototype = Object.create(base.prototype);
		proto.run = function() {
			var specElement = this.spec,
				idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expression = Expression.parseOperand(specElement, vps),
				optimized = expression.optimize();
			assert.deepEqual(constify(this.expectedOptimized()), expressionToJson(optimized));
		};
		return klass;
	})(),
	FieldRangeOptimize = (function() {
		var klass = function FieldRangeOptimize() {
				base.apply(this, arguments);
			},
			base = OptimizeBase,
			proto = klass.prototype = Object.create(base.prototype);
		proto.expectedOptimized = function(){
			return this.spec;
		};
		return klass;
	})(),
	NoOptimize = (function() {
		var klass = function NoOptimize() {
				base.apply(this, arguments);
			},
			base = OptimizeBase,
			proto = klass.prototype = Object.create(base.prototype);
		proto.expectedOptimized = function(){
			return this.spec;
		};
		return klass;
	})(),
	ExpectedResultBase = (function() {
		/** Check expected result for expressions depending on constants. */
		var klass = function ExpectedResultBase() {
				base.apply(this, arguments);
			},
			base = OptimizeBase,
			proto = klass.prototype = Object.create(base.prototype);
		proto.run = function() {
			base.prototype.run.call(this);
			var specElement = this.spec,
				idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expression = Expression.parseOperand(specElement, vps);
			// Check expression spec round trip.
			assert.deepEqual(expressionToJson(expression), constify(specElement));
			// Check evaluation result.
			assert.strictEqual(expression.evaluate({}), this.expectedResult);
			// Check that the result is the same after optimizing.
			var optimized = expression.optimize();
			assert.strictEqual(optimized.evaluate({}), this.expectedResult);
		};
		proto.expectedOptimized = function() {
			return {$const:this.expectedResult};
		};
		return klass;
	})(),
	ExpectedTrue = (function(){
		var klass = function ExpectedTrue() {
				base.apply(this, arguments);
			},
			base = ExpectedResultBase,
			proto = klass.prototype = Object.create(base.prototype);
		proto.expectedResult = true;
		return klass;
	})(),
	ExpectedFalse = (function(){
		var klass = function ExpectedFalse() {
				base.apply(this, arguments);
			},
			base = ExpectedResultBase,
			proto = klass.prototype = Object.create(base.prototype);
		proto.expectedResult = false;
		return klass;
	})(),
	ParseError = (function(){
		var klass = function ParseError() {
				base.apply(this, arguments);
			},
			base = TestBase,
			proto = klass.prototype = Object.create(base.prototype);
		proto.run = function() {
			var specElement = this.spec,
				idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator);
			assert.throws(function() {
				Expression.parseOperand(specElement, vps);
			});
		};
		return klass;
	})();

exports.CompareExpression = {

	"constructor()": {

		"should throw Error if no args": function() {
			assert.throws(function() {
				new CompareExpression();
			});
		},

		"should throw if more than 1 args": function() {
			assert.throws(function() {
				new CompareExpression(1,2);
			});
		},

		"should not throw if 1 arg and arg is string": function() {
			assert.doesNotThrow(function() {
				new CompareExpression("a");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $eq, $ne, $gt, $gte, $lt, $lte, $cmp": function() {
			assert.equal(new CompareExpression(CompareExpression.CmpOp.EQ).getOpName(), "$eq");
			assert.equal(new CompareExpression(CompareExpression.CmpOp.NE).getOpName(), "$ne");
			assert.equal(new CompareExpression(CompareExpression.CmpOp.GT).getOpName(), "$gt");
			assert.equal(new CompareExpression(CompareExpression.CmpOp.GTE).getOpName(), "$gte");
			assert.equal(new CompareExpression(CompareExpression.CmpOp.LT).getOpName(), "$lt");
			assert.equal(new CompareExpression(CompareExpression.CmpOp.LTE).getOpName(), "$lte");
			assert.equal(new CompareExpression(CompareExpression.CmpOp.CMP).getOpName(), "$cmp");
		},

	},

	"#evaluate()": {

		/** $eq with first < second. */
		"EqLt": function EqLt() {
			new ExpectedFalse({
				spec: {$eq:[1,2]},
			}).run();
		},

		/** $eq with first == second. */
		"EqEq": function EqEq() {
			new ExpectedTrue({
				spec: {$eq:[1,1]},
			}).run();
		},

		/** $eq with first > second. */
		"EqGt": function EqEq() {
			new ExpectedFalse({
				spec: {$eq:[1,0]},
			}).run();
		},

		/** $ne with first < second. */
		"NeLt": function NeLt() {
			new ExpectedTrue({
				spec: {$ne:[1,2]},
			}).run();
		},

		/** $ne with first == second. */
		"NeEq": function NeEq() {
			new ExpectedFalse({
				spec: {$ne:[1,1]},
			}).run();
		},

		/** $ne with first > second. */
		"NeGt": function NeGt() {
			new ExpectedTrue({
				spec: {$ne:[1,0]},
			}).run();
		},

		/** $gt with first < second. */
		"GtLt": function GtLt() {
			new ExpectedFalse({
				spec: {$gt:[1,2]},
			}).run();
		},

		/** $gt with first == second. */
		"GtEq": function GtEq() {
			new ExpectedFalse({
				spec: {$gt:[1,1]},
			}).run();
		},

		/** $gt with first > second. */
		"GtGt": function GtGt() {
			new ExpectedTrue({
				spec: {$gt:[1,0]},
			}).run();
		},

		/** $gte with first < second. */
		"GteLt": function GteLt() {
			new ExpectedFalse({
				spec: {$gte:[1,2]},
			}).run();
		},

		/** $gte with first == second. */
		"GteEq": function GteEq() {
			new ExpectedTrue({
				spec: {$gte:[1,1]},
			}).run();
		},

		/** $gte with first > second. */
		"GteGt": function GteGt() {
			new ExpectedTrue({
				spec: {$gte:[1,0]},
			}).run();
		},

		/** $gte with first > second. */
		"LtLt": function LtLt() {
			new ExpectedTrue({
				spec: {$lt:[1,2]},
			}).run();
		},

		/** $lt with first == second. */
		"LtEq": function LtEq() {
			new ExpectedFalse({
				spec: {$lt:[1,1]},
			}).run();
		},

		/** $lt with first > second. */
		"LtGt": function LtGt() {
			new ExpectedFalse({
				spec: {$lt:[1,0]},
			}).run();
		},

		/** $lte with first < second. */
		"LteLt": function LteLt() {
			new ExpectedTrue({
				spec: {$lte:[1,2]},
			}).run();
		},

		/** $lte with first == second. */
		"LteEq": function LteEq() {
			new ExpectedTrue({
				spec: {$lte:[1,1]},
			}).run();
		},

		/** $lte with first > second. */
		"LteGt": function LteGt() {
			new ExpectedFalse({
				spec: {$lte:[1,0]},
			}).run();
		},

		/** $cmp with first < second. */
		"CmpLt": function CmpLt() {
			new ExpectedResultBase({
				spec: {$cmp:[1,2]},
				expectedResult: -1,
			}).run();
		},

		/** $cmp with first == second. */
		"CmpEq": function CmpEq() {
			new ExpectedResultBase({
				spec: {$cmp:[1,1]},
				expectedResult: 0,
			}).run();
		},

		/** $cmp with first > second. */
		"CmpGt": function CmpGt() {
			new ExpectedResultBase({
				spec: {$cmp:[1,0]},
				expectedResult: 1,
			}).run();
		},

		/** $cmp results are bracketed to an absolute value of 1. */
		"CmpBracketed": function CmpBracketed() {
			var test = new ExpectedResultBase({
				spec: {$cmp:["z","a"]},
				expectedResult: 1,
			}).run();
		},

		/** Zero operands provided. */
		"ZeroOperands": function ZeroOperands() {
			new ParseError({
				spec: {$ne:[]},
			}).run();
		},

		/** One operands provided. */
		"OneOperand": function OneOperand() {
			new ParseError({
				spec: {$eq:[1]},
			}).run();
		},

        /** Incompatible types can be compared. */
		"IncompatibleTypes": function IncompatibleTypes() {
			var specElement = {$ne:["a",1]},
				idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand(specElement, vps);
			assert.deepEqual(expr.evaluate({}), true);
		},

		/** Three operands provided. */
		"ThreeOperands": function ThreeOperands() {
			new ParseError({
				spec: {$gt:[2,3,4]},
			}).run();
		},

		/**
		 * An expression depending on constants is optimized to a constant via
		 * ExpressionNary::optimize().
		 */
		"OptimizeConstants": function OptimizeConstants() {
			new OptimizeBase({
				spec: {$eq:[1,1]},
				expectedOptimized: function() {
					return {$const: true};
				},
			}).run();
		},

		/** $cmp is not optimized. */
		"NoOptimizeCmp": function NoOptimizeCmp() {
			new NoOptimize({
				spec: {$cmp:[1,"$a"]},
			}).run();
		},

		/** $ne is not optimized. */
		"NoOptimizeNe": function NoOptimizeNe() {
			new NoOptimize({
				spec: {$ne:[1,"$a"]},
			}).run();
		},

		/** No optimization is performend without a constant. */
		"NoOptimizeNoConstant": function NoOptimizeNoConstant() {
			new NoOptimize({
				spec: {$ne:["$a", "$b"]},
			}).run();
		},

		/** No optimization is performend without an immediate field path. */
		"NoOptimizeWithoutFieldPath": function NoOptimizeWithoutFieldPath() {
			new NoOptimize({
				spec: {$eq:[{$and:["$a"]},1]},
			}).run();
		},

		/** No optimization is performend without an immediate field path. */
		"NoOptimizeWithoutFieldPathReverse": function NoOptimizeWithoutFieldPathReverse() {
			new NoOptimize({
				spec: {$eq:[1,{$and:["$a"]}]},
			}).run();
		},

		/** An equality expression is optimized. */
		"OptimizeEq": function OptimizeEq() {
			new FieldRangeOptimize({
				spec: {$eq:["$a",1]},
			}).run();
		},

		/** A reverse sense equality expression is optimized. */
		"OptimizeEqReverse": function OptimizeEqReverse() {
			new FieldRangeOptimize({
				spec: {$eq:[1,"$a"]},
			}).run();
		},

		/** A $lt expression is optimized. */
		"OptimizeLt": function OptimizeLt() {
			new FieldRangeOptimize({
				spec: {$lt:["$a",1]},
			}).run();
		},

		/** A reverse sense $lt expression is optimized. */
		"OptimizeLtReverse": function OptimizeLtReverse() {
			new FieldRangeOptimize({
				spec: {$lt:[1,"$a"]},
			}).run();
		},

		/** A $lte expression is optimized. */
		"OptimizeLte": function OptimizeLte() {
			new FieldRangeOptimize({
				spec: {$lte:["$b",2]},
			}).run();
		},

		/** A reverse sense $lte expression is optimized. */
		"OptimizeLteReverse": function OptimizeLteReverse() {
			new FieldRangeOptimize({
				spec: {$lte:[2,"$b"]},
			}).run();
		},

		/** A $gt expression is optimized. */
		"OptimizeGt": function OptimizeGt() {
			new FieldRangeOptimize({
				spec: {$gt:["$b",2]},
			}).run();
		},

		/** A reverse sense $gt expression is optimized. */
		"OptimizeGtReverse": function OptimizeGtReverse() {
			new FieldRangeOptimize({
				spec: {$gt:["$b",2]},
			}).run();
		},

		/** A $gte expression is optimized. */
		"OptimizeGte": function OptimizeGte() {
			new FieldRangeOptimize({
				spec: {$gte:["$b",2]},
			}).run();
		},

		/** A reverse sense $gte expression is optimized. */
		"OptimizeGteReverse": function OptimizeGteReverse() {
			new FieldRangeOptimize({
				spec: {$gte:[2,"$b"]},
			}).run();
		},

	},

};
