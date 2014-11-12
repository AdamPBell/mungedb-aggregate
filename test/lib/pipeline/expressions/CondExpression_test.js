"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	CondExpression = require("../../../../lib/pipeline/expressions/CondExpression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

exports.CondExpression = {

	"constructor()": {

		"should not throw an Error when constructing without args": function testConstructor(){
			assert.doesNotThrow(function(){
				new CondExpression();
			});
		},

		"should throw Error when constructing with 1 arg": function testConstructor1(){
			assert.throws(function(){
				new CondExpression(1);
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $cond": function testOpName(){
			assert.equal(new CondExpression().getOpName(), "$cond");
		},

	},

	"#evaluate()": {
		"array style": {

			"should fail if there aren't enough arguments": function() {
				assert.throws(function(){
					Expression.parseOperand({$cond:[1,2]}, {});
				});
			},

			"should fail if there are too many arguments": function() {
				assert.throws(function(){
					Expression.parseOperand({$cond:[1, 2, 3, 4]}, {});
				});
			},

			"should evaluate boolean expression as true, then return 1; [ true === true, 1, 0 ]": function () {
				assert.strictEqual(Expression.parseOperand({$cond: [ true, 1, 0 ]}, {}).evaluate({}), 1);
			},

			"should evaluate boolean expression as false, then return 0; [ false === true, 1, 0 ]": function () {
				assert.strictEqual(Expression.parseOperand({$cond: [ false, 1, 0 ]}, {}).evaluate({}), 0);
			},

		},

		"object style": {

			beforeEach: function(){
				this.shouldFail = function(expr) {
					assert.throws(function(){
						Expression.parseOperand(expr, {});
					});
				};
				this.vps = new VariablesParseState(new VariablesIdGenerator());
			},

			"should fail because of missing if": function(){
				this.shouldFail({$cond:{ then:2, else:3}});
			},

			"should fail because of missing then": function(){
				this.shouldFail({$cond:{if:1,  else:3}});
			},

			"should fail because of missing else": function(){
				this.shouldFail({$cond:{if:1, then:2 }});
			},

			"should fail because of mystery args": function(){
				this.shouldFail({$cond:{if:1, then:2, else:3, zoot:4}});
			},

			"should evaluate true": function(){
				assert.strictEqual(
					Expression.parseOperand({$cond:{ if: true, then: 1, else: 0}}, {}).evaluate({}),
					1);
			},

			"should evaluate true even with mixed up args": function(){
				assert.strictEqual(
					Expression.parseOperand({$cond:{ else: 0, then: 1, if: "$a" }}, this.vps).evaluate({a: 1}),
					1);
			},

			"should evaluate false": function(){
				assert.strictEqual(
					Expression.parseOperand({$cond:{ if: "$a", then: 0, else: 1}}, this.vps).evaluate({a: 0}),
					1);
			},

			"should evaluate false even with mixed up args": function() {
				assert.strictEqual(
					Expression.parseOperand({$cond: { else: 1, then: 0, if: "$a"}}, this.vps).evaluate({a: 0}),
					1);
			},

		},

	},

};
