"use strict";
var assert = require("assert"),
	StrcasecmpExpression = require("../../../../lib/pipeline/expressions/StrcasecmpExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	utils = require("./utils"),
	constify = utils.constify,
	expressionToJson = utils.expressionToJson;

module.exports = {

	"StrcasecmpExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new StrcasecmpExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $strcasecmp": function testOpName(){
				assert.equal(new StrcasecmpExpression().getOpName(), "$strcasecmp");
			}

		},

		"evaluate": {

			"before": function before() {
				this.run = function run() {
					this.assertResult(this.expectedResult, this.spec());
					this.assertResult(-this.expectedResult, this.reverseSpec());
				};
				this.a = undefined;
				this.b = undefined;
				this.expectedResult = undefined;
				this.spec = function spec() {return {$strcasecmp:[this.a, this.b]}; };
				this.reverseSpec = function reverseSpec() {return {$strcasecmp:[this.b, this.a]}; };
				this.assertResult = function assertResult(expectedResult, spec) {
					var idGenerator = new VariablesIdGenerator(),
						vps = new VariablesParseState(idGenerator),
						expression = Expression.parseOperand(spec, vps);
					assert.deepEqual(constify(spec), expressionToJson(expression));
					assert.equal(expectedResult, expression.evaluate({}));
				};
			},

			"NullBegin": function NullBegin() {
				this.a = "\0ab";
				this.b = "\0AB";
				this.expectedResult = 0;
				this.run();
			},

			"NullEnd": function NullEnd() {
				this.a = "ab\0";
				this.b = "AB\0";
				this.expectedResult = 0;
				this.run();
			},

			"NullMiddleLt": function NullMiddleLt() {
				this.a = "a\0a";
				this.b = "A\0B";
				this.expectedResult = -1;
				this.run();
			},

			"NullMiddleEq": function NullMiddleEq() {
				this.a = "a\0b";
				this.b = "a\0B";
				this.expectedResult = 0;
				this.run();
			},

			"NullMiddleGt": function NullMiddleGt() {
				this.a = "a\0c";
				this.b = "a\0B";
				this.expectedResult = 1;
				this.run();
			}
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
