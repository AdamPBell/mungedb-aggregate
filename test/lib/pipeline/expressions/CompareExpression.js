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

module.exports = {

	"CompareExpression": {

		"constructor()": {

			"should throw Error if no args": function testConstructor() {
				assert.throws(function() {
					new CompareExpression();
				});
			},

			"should throw if more than 1 args": function testConstructor() {
				assert.throws(function() {
					new CompareExpression(1,2);
				});
			},

			"should not throw if 1 arg and arg is string": function testConstructor() {
				assert.doesNotThrow(function() {
					new CompareExpression("a");
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $eq, $ne, $gt, $gte, $lt, $lte, $cmp": function testOpName() {
				assert.equal((new CompareExpression(CompareExpression.EQ)).getOpName(), "$eq");
				assert.equal((new CompareExpression(CompareExpression.NE)).getOpName(), "$ne");
				assert.equal((new CompareExpression(CompareExpression.GT)).getOpName(), "$gt");
				assert.equal((new CompareExpression(CompareExpression.GTE)).getOpName(), "$gte");
				assert.equal((new CompareExpression(CompareExpression.LT)).getOpName(), "$lt");
				assert.equal((new CompareExpression(CompareExpression.LTE)).getOpName(), "$lte");
				assert.equal((new CompareExpression(CompareExpression.CMP)).getOpName(), "$cmp");
			}

		},

		"#evaluate()": {

			before: function before() {
				var self = this;
				//OptimizeBase
				this.OptimizeBase = function() {};
				var oBProto = this.OptimizeBase.prototype;
				oBProto.run = function run() {
					var specElement = this.spec(),
						idGenerator = new VariablesIdGenerator(),
						vps = new VariablesParseState(idGenerator),
						expression = Expression.parseOperand(specElement, vps),
						optimized = expression.optimize();
					assert.deepEqual(constify(this.expectedOptimized()), expressionToJson(optimized));
				};
				//FieldRangeOptimize
				this.FieldRangeOptimize = function FieldRangeOptimize() {};
				var fROProto = Object.create(oBProto);
				this.FieldRangeOptimize.prototype = fROProto;
				fROProto.expectedOptimized = function() {
					return this.spec();
				};
				//NoOptimize
				this.NoOptimize = function NoOptimize() {};
				var nOProto = Object.create(oBProto);
				this.NoOptimize.prototype = nOProto;
				nOProto.expectedOptimized = function() {
					return this.spec();
				};
				//ExpectedResultBase
				this.ExpectedResultBase = function ExpectedResultBase() {};
				var eRBProto = Object.create(oBProto);
				this.ExpectedResultBase.prototype = eRBProto;
				eRBProto.run = function run() {
					oBProto.run.call(this);
					var specElement = this.spec(),
						idGenerator = new VariablesIdGenerator(),
						vps = new VariablesParseState(idGenerator),
						expression = Expression.parseOperand(specElement, vps);
					assert.deepEqual(expressionToJson(expression),
						constify(specElement));
					assert.strictEqual(expression.evaluate({}),
						this.expectedResult());
					var optimized = expression.optimize();
					assert.strictEqual(optimized.evaluate({}),
						this.expectedResult());
				};
				eRBProto.expectedOptimized = function expectedOptimized() {
					return {$const:this.expectedResult()};
				};
				//ExpectedTrue
				this.ExpectedTrue = function ExpectedTrue() {};
				var eTProto = Object.create(eRBProto);
				this.ExpectedTrue.prototype = eTProto;
				eTProto.expectedResult = function() {
					return true;
				};
				//ExpectedTrue
				this.ExpectedFalse = function ExpectedFalse() {};
				var eFProto = Object.create(eRBProto);
				this.ExpectedFalse.prototype = eFProto;
				eFProto.expectedResult = function() {
					return false;
				};
				//ParseError
				this.ParseError = function ParseError() {};
				var pEProto = this.ParseError.prototype;
				pEProto.run = function run() {
					var specElement = this.spec(),
						idGenerator = new VariablesIdGenerator(),
						vps = new VariablesParseState(idGenerator);
					assert.throws(function() {
						Expression.parseOperand(specElement, vps);
					});
				};
				//IncompatibleTypes
				this.IncompatibleTypes = function IncompatibleTypes() {};
				var iTProto = this.IncompatibleTypes.prototype;
				iTProto.run = function() {
					var specElement = {$ne:["a", 1]},
						idGenerator = new VariablesIdGenerator(),
						vps = new VariablesParseState(idGenerator),
						expression = Expression.parseOperand(specElement, vps);
					assert.strictEqual(expression.evaluate({}), true);
				};
			},

			/** $eq with first < second. */
			"EqLt": function EqLt() {
				var test = new this.ExpectedFalse();
				test.spec = function() {
					return {$eq:[1,2]};
				};
				test.run();
			},

			/** $eq with first == second. */
			"EqEq": function EqEq() {
				var test = new this.ExpectedTrue();
				test.spec = function() {
					return {$eq:[1,1]};
				};
				test.run();
			},

			/** $eq with first > second. */
			"EqGt": function EqEq() {
				var test = new this.ExpectedFalse();
				test.spec = function() {
					return {$eq:[1,0]};
				};
				test.run();
			},

			/** $ne with first < second. */
			"NeLt": function NeLt() {
				var test = new this.ExpectedTrue();
				test.spec = function() {
					return {$ne:[1,2]};
				};
				test.run();
			},

			/** $ne with first == second. */
			"NeEq": function NeEq() {
				var test = new this.ExpectedFalse();
				test.spec = function() {
					return {$ne:[1,1]};
				};
				test.run();
			},

			/** $ne with first > second. */
			"NeGt": function NeGt() {
				var test = new this.ExpectedTrue();
				test.spec = function() {
					return {$ne:[1,0]};
				};
				test.run();
			},

			/** $gt with first < second. */
			"GtLt": function GtLt() {
				var test = new this.ExpectedFalse();
				test.spec = function() {
					return {$gt:[1,2]};
				};
				test.run();
			},

			/** $gt with first == second. */
			"GtEq": function GtEq() {
				var test = new this.ExpectedFalse();
				test.spec = function() {
					return {$gt:[1,1]};
				};
				test.run();
			},

			/** $gt with first > second. */
			"GtGt": function GtGt() {
				var test = new this.ExpectedTrue();
				test.spec = function() {
					return {$gt:[1,0]};
				};
				test.run();
			},

			/** $gte with first < second. */
			"GteLt": function GteLt() {
				var test = new this.ExpectedFalse();
				test.spec = function() {
					return {$gte:[1,2]};
				};
				test.run();
			},

			/** $gte with first == second. */
			"GteEq": function GteEq() {
				var test = new this.ExpectedTrue();
				test.spec = function() {
					return {$gte:[1,1]};
				};
				test.run();
			},

			/** $gte with first > second. */
			"GteGt": function GteGt() {
				var test = new this.ExpectedTrue();
				test.spec = function() {
					return {$gte:[1,0]};
				};
				test.run();
			},

			/** $gte with first > second. */
			"LtLt": function LtLt() {
				var test = new this.ExpectedTrue();
				test.spec = function() {
					return {$lt:[1,2]};
				};
				test.run();
			},

			/** $lt with first == second. */
			"LtEq": function LtEq() {
				var test = new this.ExpectedFalse();
				test.spec = function() {
					return {$lt:[1,1]};
				};
				test.run();
			},

			/** $lt with first > second. */
			"LtGt": function LtGt() {
				var test = new this.ExpectedFalse();
				test.spec = function() {
					return {$lt:[1,0]};
				};
				test.run();
			},

			/** $lte with first < second. */
			"LteLt": function LteLt() {
				var test = new this.ExpectedTrue();
				test.spec = function() {
					return {$lte:[1,2]};
				};
				test.run();
			},

			/** $lte with first == second. */
			"LteEq": function LteEq() {
				var test = new this.ExpectedTrue();
				test.spec = function() {
					return {$lte:[1,1]};
				};
				test.run();
			},

			/** $lte with first > second. */
			"LteGt": function LteGt() {
				var test = new this.ExpectedFalse();
				test.spec = function() {
					return {$lte:[1,0]};
				};
				test.run();
			},

			/** $cmp with first < second. */
			"CmpLt": function CmpLt() {
				var test = new this.ExpectedResultBase();
				test.spec = function() {
					return {$cmp:[1,2]};
				};
				test.expectedResult = function() {
					return -1;
				};
				test.run();
			},

			/** $cmp with first == second. */
			"CmpEq": function CmpEq() {
				var test = new this.ExpectedResultBase();
				test.spec = function() {
					return {$cmp:[1,1]};
				};
				test.expectedResult = function() {
					return 0;
				};
				test.run();
			},

			/** $cmp with first > second. */
			"CmpGt": function CmpGt() {
				var test = new this.ExpectedResultBase();
				test.spec = function() {
					return {$cmp:[1,0]};
				};
				test.expectedResult = function() {
					return 1;
				};
				test.run();
			},

			/** $cmp results are bracketed to an absolute value of 1. */
			"CmpBracketed": function CmpBracketed() {
				var test = new this.ExpectedResultBase();
				test.spec = function() {
					return {$cmp:["z","a"]};
				};
				test.expectedResult = function() {
					return 1;
				};
				test.run();
			},

			/** Zero operands provided. */
			"ZeroOperands": function ZeroOperands() {
				var test = new this.ParseError();
				test.spec = function() {
					return {$ne:[]};
				};
				test.run();
			},

			/** One operands provided. */
			"OneOperand": function OneOperand() {
				var test = new this.ParseError();
				test.spec = function() {
					return {$eq:[1]};
				};
				test.run();
			},

			/** Three operands provided. */
			"ThreeOperands": function ThreeOperands() {
				var test = new this.ParseError();
				test.spec = function() {
					return {$gt:[2,3,4]};
				};
				test.run();
			},

			/**
			 * An expression depending on constants is optimized to a constant via
			 * ExpressionNary::optimize().
			 */
			"OptimizeConstants": function OptimizeConstants() {
				var test = new this.OptimizeBase();
				test.spec = function() {
					return {$eq:[1,1]};
				};
				test.expectedOptimized = function() {
					return {$const:true};
				};
				test.run();
			},

			/** $cmp is not optimized. */
			"NoOptimizeCmp": function NoOptimizeCmp() {
				var test = new this.NoOptimize();
				test.spec = function() {
					return {$cmp:[1,"$a"]};
				};
				test.run();
			},

			/** $ne is not optimized. */
			"NoOptimizeNe": function NoOptimizeNe() {
				var test = new this.NoOptimize();
				test.spec = function() {
					return {$ne:[1,"$a"]};
				};
				test.run();
			},

			/** No optimization is performend without a constant. */
			"NoOptimizeNoConstant": function NoOptimizeNoConstant() {
				var test = new this.NoOptimize();
				test.spec = function() {
					return {$ne:["$a", "$b"]};
				};
				test.run();
			},

			/** No optimization is performend without an immediate field path. */
			"NoOptimizeWithoutFieldPath": function NoOptimizeWithoutFieldPath() {
				var test = new this.NoOptimize();
				test.spec = function() {
					return {$eq:[{$and:["$a"]},1]};
				};
				test.run();
			},

			/** No optimization is performend without an immediate field path. */
			"NoOptimizeWithoutFieldPathReverse": function NoOptimizeWithoutFieldPathReverse() {
				var test = new this.NoOptimize();
				test.spec = function() {
					return {$eq:[1,{$and:["$a"]}]};
				};
				test.run();
			},

			/** An equality expression is optimized. */
			"OptimizeEq": function OptimizeEq() {
				var test = new this.FieldRangeOptimize();
				test.spec = function() {
					return {$eq:["$a",1]};
				};
				test.run();
			},

			/** A reverse sense equality expression is optimized. */
			"OptimizeEqReverse": function OptimizeEqReverse() {
				var test = new this.FieldRangeOptimize();
				test.spec = function() {
					return {$eq:[1,"$a"]};
				};
				test.run();
			},

			/** A $lt expression is optimized. */
			"OptimizeLt": function OptimizeLt() {
				var test = new this.FieldRangeOptimize();
				test.spec = function() {
					return {$lt:["$a",1]};
				};
				test.run();
			},

			/** A reverse sense $lt expression is optimized. */
			"OptimizeLtReverse": function OptimizeLtReverse() {
				var test = new this.FieldRangeOptimize();
				test.spec = function() {
					return {$lt:[1,"$a"]};
				};
				test.run();
			},

			/** A $lte expression is optimized. */
			"OptimizeLte": function OptimizeLte() {
				var test = new this.FieldRangeOptimize();
				test.spec = function() {
					return {$lte:["$b",2]};
				};
				test.run();
			},

			/** A reverse sense $lte expression is optimized. */
			"OptimizeLteReverse": function OptimizeLteReverse() {
				var test = new this.FieldRangeOptimize();
				test.spec = function() {
					return {$lte:[2,"$b"]};
				};
				test.run();
			},

			/** A $gt expression is optimized. */
			"OptimizeGt": function OptimizeGt() {
				var test = new this.FieldRangeOptimize();
				test.spec = function() {
					return {$gt:["$b",2]};
				};
				test.run();
			},

			/** A reverse sense $gt expression is optimized. */
			"OptimizeGtReverse": function OptimizeGtReverse() {
				var test = new this.FieldRangeOptimize();
				test.spec = function() {
					return {$gt:["$b",2]};
				};
				test.run();
			},

			/** A $gte expression is optimized. */
			"OptimizeGte": function OptimizeGte() {
				var test = new this.FieldRangeOptimize();
				test.spec = function() {
					return {$gte:["$b",2]};
				};
				test.run();
			},

			/** A reverse sense $gte expression is optimized. */
			"OptimizeGteReverse": function OptimizeGteReverse() {
				var test = new this.FieldRangeOptimize();
				test.spec = function() {
					return {$gte:[2,"$b"]};
				};
				test.run();
			},


		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
