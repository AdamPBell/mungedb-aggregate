"use strict";
var assert = require("assert"),
	ToLowerExpression = require("../../../../lib/pipeline/expressions/ToLowerExpression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"ToLowerExpression": {

		beforeEach: function () {
			this.vps = new VariablesParseState(new VariablesIdGenerator());
		},

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor() {
				assert.doesNotThrow(function () {
					new ToLowerExpression();
				});
			},

			"should throw Error when constructing with args": function testConstructor() {
				assert.throws(function () {
					new ToLowerExpression(1);
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $toLower": function testOpName() {
				assert.equal(new ToLowerExpression().getOpName(), "$toLower");
			}

		},

		"#evaluate()": {

			"should lowercase a string": function(){
				assert.strictEqual(Expression.parseOperand({$toLower: "$a"}, this.vps).evaluate({a: "NOW IS THE TIME"}), "now is the time");
			},
			"should not change symbols": function(){
				var symbs = "!@#$%^&*()_+{}[]:\";'<>?/.,;";
				assert.strictEqual(Expression.parseOperand({$toLower: "$a"}, this.vps).evaluate({a: symbs}), symbs);
			},
			"should not change lowercase": function(){
				var symbs = "now is the time for all good men to come from the aid of their computers";
				assert.strictEqual(Expression.parseOperand({$toLower: "$a"}, this.vps).evaluate({a: symbs}), symbs);
			},
			"should return the lowercase version of the string if there is a null character in the middle of the string": function() {
				assert.strictEqual(Expression.parseOperand({$toLower: "$a"}, this.vps).evaluate({a: "a\0B"}), "a\0b");
			},
			"should return the lowercase version of the string if there is a null character at the beginning of the string": function() {
				assert.strictEqual(Expression.parseOperand({$toLower: "$a"}, this.vps).evaluate({a: "\0aB"}), "\0ab");
			},
			"should return the lowercase version of the string if there is a null character at the end of the string": function() {
				assert.strictEqual(Expression.parseOperand({$toLower: "$a" }, this.vps).evaluate({a: "aB\0"}), "ab\0");
			}
		}
	}
};

if (!module.parent)(new (require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);