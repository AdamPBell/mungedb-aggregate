"use strict";
var assert = require("assert"),
	DepsTracker = require("../../../../lib/pipeline/DepsTracker"),
	LetExpression = require("../../../../lib/pipeline/expressions/LetExpression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression"),
	MultiplyExpression = require("../../../../lib/pipeline/expressions/MultiplyExpression"), //jshint ignore:line
	AddExpression = require("../../../../lib/pipeline/expressions/AddExpression"), //jshint ignore:line
	CondExpression = require("../../../../lib/pipeline/expressions/CondExpression"), //jshint ignore:line
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"), //jshint ignore:line
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	Variables = require("../../../../lib/pipeline/expressions/Variables"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

exports.LetExpression = {

	beforeEach: function() {
		this.vps = new VariablesParseState(new VariablesIdGenerator());
	},

	"constructor()": {

		"should throw an Error when constructing without args": function() {
			assert.throws(function() {
				new LetExpression();
			});
		},

		"should throw Error when constructing with one arg": function() {
			assert.throws(function() {
				new LetExpression(1);
			});
		},

		"should not throw when constructing with two args": function() {
			assert.doesNotThrow(function() {
				new LetExpression(1, 2);
			});
		},

	},

	"#parse()": {

		"should throw if $let isn't in expr": function() {
			var self = this;
			assert.throws(function() {
				Expression.parseOperand({$xlet: ['$$a', 1]}, self.vps);
			}, /15999/);
		},

		"should throw if the $let expression isn't an object": function() {
			var self = this;
			assert.throws(function() {
				Expression.parseOperand({$let: "this is not an object"}, self.vps);
			}, /16874/);
		},

		"should throw if the $let expression is an array": function() {
			var self = this;
			assert.throws(function() {
				Expression.parseOperand({$let: [1, 2, 3]}, self.vps);
			}, /16874/);
		},

		"should throw if there is no vars parameter to $let": function() {
			var self = this;
			assert.throws(function() {
				Expression.parseOperand({$let: {vars: undefined}}, self.vps);
			}, /16876/);
		},

		"should throw if there is no input parameter to $let": function() {
			var self = this;
			assert.throws(function() {
				Expression.parseOperand({$let: {vars: 1, in: undefined}}, self.vps);
			}, /16877/);
		},

		"should throw if any of the arguments to $let are not 'in' or 'vars'": function() {
			var self = this;
			assert.throws(function() {
				Expression.parseOperand({$let: {vars: 1, in: 2, zoot:3}}, self.vps);
			}, /16875/);
		},

		"should return a Let expression": function() {
			var x = Expression.parseOperand({$let: {vars: {a:{$const:123}}, in: 2}}, this.vps);
			assert(x instanceof LetExpression);
			assert(x._subExpression instanceof ConstantExpression);
			assert.strictEqual(x._subExpression.getValue(), 2);
			assert(x._variables[0].expression instanceof ConstantExpression);
			assert.strictEqual(x._variables[0].expression.getValue(), 123);
		},

		"should show we collect multiple vars": function() {
			var x = Expression.parseOperand({$let: {vars: {a:{$const:1}, b:{$const:2}, c:{$const:3}}, in: 2}}, this.vps);
			assert.strictEqual(x._variables[0].expression.getValue(), 1);
			assert.strictEqual(x._variables[1].expression.getValue(), 2);
			assert.strictEqual(x._variables[2].expression.getValue(), 3);
		},

	},

	"#optimize()": {

		beforeEach: function() {
			this.testInOpt = function(expr, expected) {
				assert(expr._subExpression instanceof ConstantExpression, "should have $const subexpr");
				assert.strictEqual(expr._subExpression.operands.length, 0);
				assert.strictEqual(expr._subExpression.getValue(), expected);
			};
			this.testVarOpt = function(expr, expected) {
				var varExpr = expr._variables[0].expression;
				assert(varExpr instanceof ConstantExpression, "should have $const first var");
				assert.strictEqual(varExpr.getValue(), expected);
			};
		},

		"should optimize to subexpression if no variables": function() {
			var x = Expression.parseOperand({$let:{vars:{}, in:{$multiply:[2,3]}}}, this.vps).optimize();
			assert(x instanceof ConstantExpression, "should become $const");
			assert.strictEqual(x.getValue(), 6);
		},

		"should optimize variables": function() {
			var x = Expression.parseOperand({$let:{vars:{a:{$multiply:[5,4]}}, in:{$const:6}}}, this.vps).optimize();
			this.testVarOpt(x, 20);
		},

		"should optimize subexpressions if there are variables": function() {
			var x = Expression.parseOperand({$let:{vars:{a:{$multiply:[5,4]}}, in: {$multiply:[2,3]}}}, this.vps).optimize();
			this.testInOpt(x, 6);
			this.testVarOpt(x, 20);
		},

	},

	"#serialize()": {

		"should serialize variables and the subexpression": function() {
			var s = Expression.parseOperand({$let: {vars: {a:{$const:1}, b:{$const:2}}, in: {$multiply: [2,3]}}}, this.vps).optimize().serialize("zoot");
			var expected = {$let:{vars:{a:{$const:1},b:{$const:2}},in:{$const:6}}};
			assert.deepEqual(s, expected);
		},

	},

	"#evaluate()": {

		"should perform the evaluation for variables and the subexpression": function() {
			var x = Expression.parseOperand({$let: {vars: {a: '$in1', b: '$in2'}, in: { $multiply: ["$$a", "$$b"] }}}, this.vps).optimize();
			var	y = x.evaluate(new Variables(10, {in1: 6, in2: 7}));
			assert.equal(y, 42);
		},

	},

	"#addDependencies()": {

		"should add dependencies": function() {
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
		},

	},

	"The Gauntlet": {

		"example from http://docs.mongodb.org/manual/reference/operator/aggregation/let/": function() {
			var x = Expression.parseOperand(
				{$let: { vars: { total: { $add: [ '$price', '$tax' ] },	discounted: { $cond: { if: '$applyDiscount', then: 0.9, else: 1 } }}, in: { $multiply: [ '$$total', '$$discounted' ] }}},
				this.vps).optimize();
			var y;
			y = x.evaluate(new Variables(10, {price: 90, tax: 0.05}));
			assert.equal(y, 90.05);
			y = x.evaluate(new Variables(10, {price: 90, tax: 0.05, applyDiscount: 1}));
			assert.equal(y, 90.05 * 0.9);
		},

	},

};


if (!module.parent)(new (require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
