"use strict";
var assert = require("assert"),

	LetExpression = require("../../../../lib/pipeline/expressions/LetExpression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
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
				"should throw if any of the arguments to $let are not 'in' or 'var'": function () {
					this.dieForTheRightReason({$let: {vars: 1, in: 2, zoot:3}}, /16875/);
				},
				"should throw if the var name is not writable": function () {
					this.dieForTheRightReason({$let: {vars: ["$$bad$$"], in: 2}}, /16867/);
				},
				"should return a Let expression": function () {
					var x = Expression.parseOperand({$let: {vars: ["a"], in: 2}}, this.vps);
					assert(x instanceof LetExpression);
					assert(x._subExpression instanceof ConstantExpression);
					assert(x._subExpression.getValue() == 2);
					assert(x._variables[0].a instanceof ConstantExpression);
					assert(x._variables[0].a.getValue()[0] === 'a');
				},
				"should show we collect multiple vars": function() {
					var x = Expression.parseOperand({$let: {vars: ["a", "b", "c"], in: 2}}, this.vps);
					assert.deepEqual(x._variables[0].a.getValue(), ['a','b','c']);
					assert.deepEqual(x._variables[1].b.getValue(), ['a','b','c']);
					assert.deepEqual(x._variables[2].c.getValue(), ['a','b','c']);
				},
				"should show we require vars to be wrapped in an array.": function () {
					var self = this;
					assert.throws(function () {
						Expression.parseOperand({$let: {vars: "a", in: 2}}, self.vps);
					}, /TypeError: Object a has no method 'forEach'/);
				}
			},

			"#optimize()": {
				"should optimize subexpressions if there are no variables": function () {
					assert(false);
				},
				"should optimize variables": function () {
					assert(false);
				},
				"should optimize subexpressions if there are variables": function () {
					assert(false);
				}
			},
			"#serialize()": {
				"should serialize variables and the subexpression": function () {
					assert(false);
				}
			},
			"#evaluateInternal()": {
				"should preform the evaluation for variables and the subexpression": function () {
					assert(false);
				}
			}
		}
	}
};


if (!module.parent)(new (require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

