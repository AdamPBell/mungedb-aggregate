"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ConcatExpression = require("../../../../lib/pipeline/expressions/ConcatExpression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

exports.ConcatExpression = {

	beforeEach: function() {
		this.vps = new VariablesParseState(new VariablesIdGenerator());
	},

	"constructor()": {

		"should not throw Error when constructing without args": function() {
			assert.doesNotThrow(function() {
				new ConcatExpression();
			});
		},

		"should throw Error when constructing with args": function() {
			assert.throws(function() {
				new ConcatExpression("should die");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $concat": function() {
			assert.equal(new ConcatExpression().getOpName(), "$concat");
		},

	},

	"#evaluate()": {

		"should return empty string if no operands were given; {$concat:[]}": function() {
			var expr = Expression.parseOperand({$concat:[]}, this.vps);
			assert.equal(expr.evaluate(), "");
		},

		"should return mystring if operands are my string; {$concat:[my, string]}": function() {
			var expr = Expression.parseOperand({$concat:["my", "string"]}, this.vps);
			assert.equal(expr.evaluate(), "mystring");
		},

		"should return mystring if operands are my and $a; {$concat:[my,$a]}": function() {
			var expr = Expression.parseOperand({$concat:["my","$a"]}, this.vps);
			assert.equal(expr.evaluate({a:"string"}), "mystring");
		},

		"should return null if an operand evaluates to null; {$concat:[my,$a]}": function() {
			var expr = Expression.parseOperand({$concat:["my","$a"]}, this.vps);
			assert.equal(expr.evaluate({a:null}), null);
		},

		"should return null if an operand evaluates to undefined; {$concat:[my,$a]}": function() {
			var expr = Expression.parseOperand({$concat:["my","$a"]}, this.vps);
			assert.equal(expr.evaluate({a:undefined}), null);
		},

		"should throw if an operand is a number": function() {
			var expr = Expression.parseOperand({$concat:["my","$a"]}, this.vps);
			assert.throws(function() {
				expr.evaluate({a:100});
			});
		},

		"should throw if an operand is a date": function() {
			var expr = Expression.parseOperand({$concat:["my","$a"]}, this.vps);
			assert.throws(function() {
				expr.evaluate({a:new Date()});
			});
		},

		"should throw if an operand is a boolean": function() {
			var expr = Expression.parseOperand({$concat:["my","$a"]}, this.vps);
			assert.throws(function() {
				expr.evaluate({a:true});
			});
		},

	},

};
