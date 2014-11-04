"use strict";
var assert = require("assert"),

	DepsTracker = require("../../../../lib/pipeline/DepsTracker"),
	LetExpression = require("../../../../lib/pipeline/expressions/LetExpression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression"),
	MultiplyExpression = require("../../../../lib/pipeline/expressions/MultiplyExpression"),
	AddExpression = require("../../../../lib/pipeline/expressions/AddExpression"),
	CondExpression = require("../../../../lib/pipeline/expressions/CondExpression"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	Variables = require("../../../../lib/pipeline/expressions/Variables"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"LetExpression": {

		beforeEach: function() {
			this.vps = new VariablesParseState(new VariablesIdGenerator());
		},

		"constructor()": {


			"should throw an Error when constructing without args": function () {
				assert.throws(function () {
					new LetExpression();
				});
			},
			"should throw Error when constructing with one arg": function () {
				assert.throws(function () {
					new LetExpression(1);
				});
			},
			"should not throw when constructing with two args": function () {
				assert.doesNotThrow(function () {
					new LetExpression(1, 2);
				});
			},

			"#parse()": {
				beforeEach: function(){
					var self = this;
					this.dieForTheRightReason = function(expr, regex) {
						var self = this;
						assert.throws(function () {
							Expression.parseOperand(expr, self.vps);
						}, regex);
					}
				},
				"should throw if $let isn't in expr": function () {
					this.dieForTheRightReason({$xlet: ['$$a', 1]}, /15999/);
				},
				"should throw if the $let expression isn't an object": function () {
					this.dieForTheRightReason({$let: "this is not an object"}, /16874/);
				},
				"should throw if the $let expression is an array": function () {
					this.dieForTheRightReason({$let: [1, 2, 3]}, /16874/);
				},
				"should throw if there is no vars parameter to $let": function () {
					this.dieForTheRightReason({$let: {noVars: 1}}, /16876/);
				},
				"should throw if there is no input parameter to $let": function () {
					this.dieForTheRightReason({$let: {vars: 1, noIn: 2}}, /16877/);
				},
				"should throw if any of the arguments to $let are not 'in' or 'vars'": function () {
					this.dieForTheRightReason({$let: {vars: 1, in: 2, zoot:3}}, /16875/);
				},
				"should throw if the var name is not writable (1)": function () {
					this.dieForTheRightReason({$let: {vars: {a:"@"}, in: 2}}, /FieldPath: '@' doesn't start with a \$; uassert code 16873/);
				},
				"should throw if the var name is not writable (2)": function () {
					this.dieForTheRightReason({$let: {vars: {a:"$$"}, in: 2}}, /empty variable names are not allowed; uassert code 16869/);
				},
				"should return a Let expression": function () {
					var x = Expression.parseOperand({$let: {vars: {a:{$const:123}}, in: 2}}, this.vps);
					assert(x instanceof LetExpression);
					assert(x._subExpression instanceof ConstantExpression);
					assert(x._subExpression.getValue() == 2);
					assert(x._variables[0].a._expressions.a instanceof ConstantExpression);
					assert.equal(x._variables[0].a._expressions.a.getValue(), 123, "Expected to see 123, but instead saw "+x._variables[0].a._expressions.a.getValue());
				},
				"should show we collect multiple vars": function() {
					var x = Expression.parseOperand({$let: {vars: {a:{$const:1}, b:{$const:2}, c:{$const:3}}, in: 2}}, this.vps);
					//TODO Kyle, this is the epitome of why I think the data structures are screwy. Put a break on the
					//next line and look at x.
					assert.deepEqual(x._variables[0].a._expressions.a.getValue(), 1);
					assert.deepEqual(x._variables[1].b._expressions.b.getValue(), 2);
					assert.deepEqual(x._variables[2].c._expressions.c.getValue(), 3);
				}
			},

			"#optimize()": {

				beforeEach: function () {
					this.testInOpt = function (expr, expected) {
						assert(expr._subExpression instanceof ConstantExpression, "Expected the $multiply to be optimized to a constant. Saw '" + expr._subExpression.constructor.name + "'");
						assert.equal(expr._subExpression.operands.length, 0, "Expected no operands, saw " + expr._subExpression.operands.length);
						assert(expr._subExpression.getValue(), expected, "Expected the multiply to optimize to "+expected+" but saw "+expr._subExpression.getValue());
					};
					this.testVarOpt = function (expr, expected) {
						var here = expr._variables[0].a._expressions.a;
						assert(here instanceof ConstantExpression, "Expected the $multiply to be optimized to a constant. Saw '" + here.constructor.name + "'");
						assert(here.getValue(), expected, "Expected the multiply to optimize to "+expected+" but saw "+here.getValue());
					};
				},

				"should optimize subexpressions if there are no variables": function () {
					var x = Expression.parseOperand({$let: {vars: {}, in: {$multiply: [2,3]}}}, this.vps).optimize();
					this.testInOpt(x, 6);
				},
				"should optimize variables": function () {
					var x = Expression.parseOperand({$let: {vars: {a: {$multiply:[5,4]}}, in: {$const: 6}}}, this.vps).optimize();
					this.testVarOpt(x, 20);
				},
				"should optimize subexpressions if there are variables": function () {
					var x = Expression.parseOperand({$let: {vars: {a: {$multiply:[5,4]}}, in: {$multiply: [2,3]}}}, this.vps).optimize();
					this.testInOpt(x, 6);
					this.testVarOpt(x, 20);
				}
			},
			"#serialize()": {
				"should serialize variables and the subexpression": function () {
					var s = Expression.parseOperand({$let: {vars: {a:{$const:1}, b:{$const:2}}, in: {$multiply: [2,3]}}}, this.vps).optimize().serialize("zoot");
					var expected = '{"$let":{"vars":{"a":{"excludeId":false,"_atRoot":false,"_expressions":{"a":{"value":1,"operands":[]},"b":{"value":2,"operands":[]}},"_order":["a","b"]},"b":{"excludeId":false,"_atRoot":false,"_expressions":{"a":{"value":1,"operands":[]},"b":{"value":2,"operands":[]}},"_order":["a","b"]}},"in":{"$const":6}}}';
					assert.deepEqual(JSON.stringify(s), expected);
				}
			},

			"#evaluateInternal()": {
				"should perform the evaluation for variables and the subexpression": function () {
					var x = Expression.parseOperand({$let: {vars: {a: '$in1', b: '$in2'}, in: { $multiply: ["$$a", "$$b"] }}}, this.vps).optimize();
					var	y = x.evaluate(new Variables(10, {in1: 6, in2: 7}));
					assert.equal(y, 42);
				}
			},

			"#addDependencies()": {
				"should add dependencies": function(){
					var expr = Expression.parseOperand({$let: {vars: {a: {$multiply:['$a','$b']}}, in: {$multiply: ['$c','$d']}}}, this.vps);
					var deps = new DepsTracker();
					expr.addDependencies(deps);
					assert.equal(Object.keys(deps.fields).length, 4);
					assert('a' in deps.fields);
					assert('b' in deps.fields);
					assert('c' in deps.fields);
					assert('d' in deps.fields);
					assert.strictEqual(deps.needWholeDocument, false);
					assert.strictEqual(deps.needTextScore, false);
				}
			},

			"The Gauntlet": {
				"example from http://docs.mongodb.org/manual/reference/operator/aggregation/let/": function () {
					var x = Expression.parseOperand(
						{$let: { vars: { total: { $add: [ '$price', '$tax' ] },	discounted: { $cond: { if: '$applyDiscount', then: 0.9, else: 1 } }}, in: { $multiply: [ '$$total', '$$discounted' ] }}},
						this.vps).optimize();
					var y;
					y = x.evaluate(new Variables(10, {price: 90, tax: .05}));
					assert.equal(y, 90.05);
					y = x.evaluate(new Variables(10, {price: 90, tax: .05, applyDiscount: 1}));
					assert.equal(y, 90.05 * .9);
				}
			}
		}
	}
};


if (!module.parent)(new (require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

