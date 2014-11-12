"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	SubstrExpression = require("../../../../lib/pipeline/expressions/SubstrExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	utils = require("./utils"),
	constify = utils.constify,
	expressionToJson = utils.expressionToJson;

var TestBase = function TestBase(overrides) {
		//NOTE: DEVIATION FROM MONGO: using this base class to make things easier to initialize
		for (var key in overrides) //jshint ignore:line
			this[key] = overrides[key];
	},
	ExpectedResultBase = (function() {
		var klass = function ExpectedResultBase() {
			base.apply(this, arguments);
		}, base = TestBase, proto = klass.prototype = Object.create(base.prototype);
		proto.run = function(){
			var specElement = this.spec(),
				idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand(specElement, vps);
			assert.deepEqual(constify(specElement), expressionToJson(expr));
			assert.deepEqual(this.expectedResult, expr.evaluate({}));
		};
		proto.spec = function() { return {$substr:[this.str, this.offset, this.length]}; };
		return klass;
	})();

exports.SubstrExpression = {

	"constructor()": {

		"should construct instance": function() {
			assert(new SubstrExpression() instanceof SubstrExpression);
			assert(new SubstrExpression() instanceof Expression);
		},

		"should error if given args": function() {
			assert.throws(function() {
				new SubstrExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $substr": function() {
			assert.equal(new SubstrExpression().getOpName(), "$substr");
		},

	},

	"evaluate": {

		"should return full string (if contains null)": function FullNull() {
			new ExpectedResultBase({
				str: "a\0b",
				offset: 0,
				length: 3,
				get expectedResult(){ return this.str; },
			}).run();
		},

		"should return tail of string (if begin at null)": function BeginAtNull() {
			new ExpectedResultBase({
				str: "a\0b",
				offset: 1,
				length: 2,
				expectedResult: "\0b",
			}).run();
		},

		"should return head of string (if end at null)": function EndAtNull() {
			new ExpectedResultBase({
				str: "a\0b",
				offset: 0,
				length: 2,
				expectedResult: "a\0",
			}).run();
		},

		"should return tail of string (if head has null) ": function DropBeginningNull() {
			new ExpectedResultBase({
				str: "\0b",
				offset: 1,
				length: 1,
				expectedResult: "b",
			}).run();
		},

		"should return head of string (if tail has null)": function DropEndingNull() {
			new ExpectedResultBase({
				str: "a\0",
				offset: 0,
				length: 1,
				expectedResult: "a",
			}).run();
		},

	},

};
