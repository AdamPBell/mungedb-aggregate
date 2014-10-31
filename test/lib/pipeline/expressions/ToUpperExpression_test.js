"use strict";
var assert = require("assert"),
	ToUpperExpression = require("../../../../lib/pipeline/expressions/ToUpperExpression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"ToUpperExpression": {
		
		beforeEach: function(){
			this.vps = new VariablesParseState(new VariablesIdGenerator());
		},

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor() {
				assert.doesNotThrow(function () {
					new ToUpperExpression();
				});
			},

			"should throw Error when constructing with args": function testConstructor() {
				assert.throws(function () {
					new ToUpperExpression(1);
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $toUpper": function testOpName() {
				assert.equal(new ToUpperExpression().getOpName(), "$toUpper");
			}

		},

		"#evaluateInternal()": {
			"should uppercase a string": function(){
				assert.strictEqual(Expression.parseOperand({$toUpper: "$a"}, this.vps).evaluate({a: "now is the time"}), "NOW IS THE TIME");
			},
			"should not change symbols": function(){
				var symbs = "!@#$%^&*()_+{}[]:\";'<>?/.,;";
				assert.strictEqual(Expression.parseOperand({$toUpper: "$a"}, this.vps).evaluate({a: symbs}), symbs);
			},
			"should not change uppercase": function(){
				var symbs = "NOW IS THE TIME FOR ALL GOOD MEN TO COME FROM THE AID OF THEIR COMPUTERS";
				assert.strictEqual(Expression.parseOperand({$toUpper: "$a"}, this.vps).evaluate({a: symbs}), symbs);
			},
			"should return the uppercase version of the string if there is a null character in the middle of the string": function testStuff() {
				assert.strictEqual(Expression.parseOperand({$toUpper: "$a"}, this.vps).evaluate({a: "a\0B"}), "A\0B");
			},
			"should return the uppercase version of the string if there is a null character at the beginning of the string": function testStuff() {
				assert.strictEqual(Expression.parseOperand({$toUpper: "$a"}, this.vps).evaluate({a: "\0aB"}), "\0AB");
			},
			"should return the uppercase version of the string if there is a null character at the end of the string": function testStuff() {
				assert.strictEqual(Expression.parseOperand({$toUpper: "$a"}, this.vps).evaluate({a: "aB\0"}), "AB\0");
			}
		}
	}
};

if (!module.parent)(new (require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);