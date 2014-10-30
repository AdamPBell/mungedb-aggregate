"use strict";
var assert = require("assert"),
	SubstrExpression = require("../../../../lib/pipeline/expressions/SubstrExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	utils = require("./utils"),
	constify = utils.constify,
	expressionToJson = utils.expressionToJson;

module.exports = {

	"SubstrExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor() {
				assert.doesNotThrow(function() {
					new SubstrExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $substr": function testOpName() {
				assert.equal(new SubstrExpression().getOpName(), "$substr");
			}

		},

		"evaluate": {

			"before": function before() {
				this.run = function run() {
					var idGenerator = new VariablesIdGenerator(),
						vps = new VariablesParseState(idGenerator),
						spec = this.spec(),
						expectedResult = this.expectedResult,
						expression = Expression.parseOperand(spec, vps);
					assert.deepEqual(constify(spec), expressionToJson(expression));
					assert.equal(expectedResult, expression.evaluate({}));
				};
				this.str = undefined;
				this.offset = undefined;
				this.length = undefined;
				this.expectedResult = undefined;
				this.spec = function spec() {return {$substr:[this.str, this.offset, this.length]}; };
			},

			"FullNull": function FullNull() {
				this.str = "a\0b";
				this.offset = 0;
				this.length = 3;
				this.expectedResult = this.str;
				this.run();
			},

			"BeginAtNull": function BeginAtNull() {
				this.str = "a\0b";
				this.offset = 1;
				this.length = 2;
				this.expectedResult = "\0b";
				this.run();
			},

			"EndAtNull": function EndAtNull() {
				this.str = "a\0b";
				this.offset = 0;
				this.length = 2;
				this.expectedResult = "a\0";
				this.run();
			},

			"DropBeginningNull": function DropBeginningNull() {
				this.str = "\0b";
				this.offset = 1;
				this.length = 1;
				this.expectedResult = "b";
				this.run();
			},

			"DropEndingNull": function DropEndingNull() {
				this.str = "a\0";
				this.offset = 0;
				this.length = 1;
				this.expectedResult = "a";
				this.run();
			},


		}
	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);