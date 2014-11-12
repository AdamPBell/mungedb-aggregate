"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	StrcasecmpExpression = require("../../../../lib/pipeline/expressions/StrcasecmpExpression"),
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
			this.assertResult(this.expectedResult, this.spec());
			this.assertResult(-this.expectedResult, this.reverseSpec());
		};
		proto.spec = function() { return {$strcasecmp:[this.a, this.b]}; };
		proto.reverseSpec = function() { return {$strcasecmp:[this.b, this.a]}; };
		proto.assertResult = function(expectedResult, spec) {
			var specElement = spec,
				idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expression = Expression.parseOperand(specElement, vps);
			assert.deepEqual(constify(spec), expressionToJson(expression));
			assert.equal(expectedResult, expression.evaluate({}));
		};
		return klass;
	})();

exports.StrcasecmpExpression = {

	"constructor()": {

		"should construct instance": function() {
			assert(new StrcasecmpExpression() instanceof StrcasecmpExpression);
			assert(new StrcasecmpExpression() instanceof Expression);
		},

		"should error if given args": function() {
			assert.throws(function() {
				new StrcasecmpExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $strcasecmp": function(){
			assert.equal(new StrcasecmpExpression().getOpName(), "$strcasecmp");
		},

	},

	"#evaluate()": {

		"should return '_ab' == '_AB' (w/ null begin)": function NullBegin() {
			new ExpectedResultBase({
				a: "\0ab",
				b: "\0AB",
				expectedResult: 0,
			}).run();
		},

		"should return 'ab_' == 'aB_' (w/ null end)": function NullEnd() {
			new ExpectedResultBase({
				a: "ab\0",
				b: "aB\0",
				expectedResult: 0,
			}).run();
		},

		"should return 'a_a' < 'a_B' (w/ null middle)": function NullMiddleLt() {
			new ExpectedResultBase({
				a: "a\0a",
				b: "a\0B",
				expectedResult: -1,
			}).run();
		},

		"should return 'a_b' == 'a_B' (w/ null middle)": function NullMiddleEq() {
			new ExpectedResultBase({
				a: "a\0b",
				b: "a\0B",
				expectedResult: 0,
			}).run();
		},

		"should return 'a_c' > 'a_B' (w/ null middle)": function NullMiddleGt() {
			new ExpectedResultBase({
				a: "a\0c",
				b: "a\0B",
				expectedResult: 1,
			}).run();
		},

	},

};
