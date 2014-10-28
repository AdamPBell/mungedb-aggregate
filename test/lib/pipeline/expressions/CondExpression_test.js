"use strict";
var assert = require("assert"),
	CondExpression = require("../../../../lib/pipeline/expressions/CondExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"CondExpression": {

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
			}
		},

		"#getOpName()": {

			"should return the correct op name; $cond": function testOpName(){
				assert.equal(new CondExpression().getOpName(), "$cond");
			}

		},

		"#evaluateInternal()": {
			"array style": {

				"should fail if there aren't enough arguments": function() {
					assert.throws(function(){
						Expression.parseOperand({$cond:[1,2]}, {});
					})
				},
				"should fail if there are too many arguments": function() {
					assert.throws(function(){
						Expression.parseOperand({$cond:[1, 2, 3, 4]}, {});
					})
				},
				"should evaluate boolean expression as true, then return 1; [ true === true, 1, 0 ]": function () {
					assert.strictEqual(Expression.parseOperand({$cond: [ true, 1, 0 ]}, {}).evaluateInternal({}), 1);
				},

				"should evaluate boolean expression as false, then return 0; [ false === true, 1, 0 ]": function () {
					assert.strictEqual(Expression.parseOperand({$cond: [ false, 1, 0 ]}, {}).evaluateInternal({}), 0);
				},
				"should fail when the 'if' position is empty": function(){
					assert.throws(function(){
						Expression.parseOperand({$cond:[undefined, 2, 3]}, {});
					})
				},
				"should fail when the 'then' position is empty": function(){
					assert.throws(function(){
						Expression.parseOperand({$cond:[1, undefined, 3]}, {});
					})
				},
				"should fail when the 'else' position is empty": function(){
					assert.throws(function(){
						Expression.parseOperand({$cond:[1, 2, undefined]}, {});
					})
				}
			},

			"object style": {
				beforeEach: function(){
					this.shouldFail = function(expr) {
						assert.throws(function(){
							Expression.parseOperand(expr, {});
						});
					}
				},
				"should fail because the $cond is missing": function(){
					this.shouldFail({$zoot:[true, 1, 0 ]}, {});
				},
				"should fail because of missing if": function(){
					this.shouldFail({$cond:{xif:1, then:2, else:3}});
				},
				"should fail because of missing then": function(){
					this.shouldFail({$cond:{if:1, xthen:2, else:3}});
				},
				"should fail because of missing else": function(){
					this.shouldFail({$cond:{if:1, then:2, xelse:3}});
				},
				"should fail because of empty if": function(){
					this.shouldFail({$cond:{if:undefined, then:2, else:3}});
				},
				"should fail because of empty then": function(){
					this.shouldFail({$cond:{if:1, then:undefined, else:3}});
				},
				"should fail because of empty else": function(){
					this.shouldFail({$cond:{if:1, then:2, else:undefined}});
				},
				"should fail because of mystery args": function(){
					this.shouldFail({$cond:{if:1, then:2, else:3, zoot:4}});
				},
				"should evaluate true": function(){
					assert.strictEqual(
						Expression.parseOperand({$cond:{ if: $a, then: 1, else: 0}}, {}).evaluate({$a: 1}),
						1);
				},
				"should evaluate true even with mixed up args": function(){
					assert.strictEqual(
						Expression.parseOperand({$cond:{ else: 0, then: 1, if: $a }}, {}).evaluate({$a: 1}),
						1);
				},
				"should evaluate false": function(){
					assert.strictEqual(
						Expression.parseOperand({$cond:{ if: $a, then: 0, else: 1}}, {}).evaluate({$a: 0}),
						1);
				},
				"should evaluate false even with mixed up args": function() {
					assert.strictEqual(
						Expression.parseOperand({$cond: { else: 1, then: 0, if: $a}}, {}).evaluate({$a: 0}),
						1);
				}
			}
		}
	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
