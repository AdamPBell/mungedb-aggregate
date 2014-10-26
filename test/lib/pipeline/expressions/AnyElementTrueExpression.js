"use strict";
var assert = require("assert"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	AnyElementTrueExpression = require("../../../../lib/pipeline/expressions/AnyElementTrueExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

var anyElementTrueExpression = new AnyElementTrueExpression();

function errMsg(expr, args, tree, expected, result) {
	return 	"for expression " + expr +
			" with argument " + args +
			" full tree: " + tree +
			" expected: " + expected +
			" result: " + result;
}

module.exports = {

	"AnyElementTrueExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new AnyElementTrueExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $anyElement": function testOpName(){
				assert.equal(new AnyElementTrueExpression().getOpName(), "$anyElementTrue");
			}

		},

		"integration": {

			"JustFalse": function JustFalse(){
				var idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					input = [[false]],
					obj = {$anyElementTrue:input},
					expr = Expression.parseExpression("$anyElementTrue", obj),
					result = expr.evaluate({}),
					expected = false,
					msg = errMsg("$anyElementTrue", input, expr.serialize(false), expected, result);
				assert.equal(result, expected, msg);
			},

			"JustTrue": function JustTrue(){
				var idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					input = [[true]],
					obj = {$anyElementTrue:input},
					expr = Expression.parseExpression("$anyElementTrue", obj),
					result = expr.evaluate({}),
					expected = true,
					msg = errMsg("$anyElementTrue", input, expr.serialize(false), expected, result);
				assert.equal(result, expected, msg);
			},

			"OneTrueOneFalse": function OneTrueOneFalse(){
				var idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					input = [[true, false]],
					obj = {$anyElementTrue:input},
					expr = Expression.parseExpression("$anyElementTrue", obj),
					result = expr.evaluate({}),
					expected = true,
					msg = errMsg("$anyElementTrue", input, expr.serialize(false), expected, result);
				assert.equal(result, expected, msg);
			},

			"Empty": function Empty(){
				var idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					input = [[]],
					obj = {$anyElementTrue:input},
					expr = Expression.parseExpression("$anyElementTrue", obj),
					result = expr.evaluate({}),
					expected = false,
					msg = errMsg("$anyElementTrue", input, expr.serialize(false), expected, result);
				assert.equal(result, expected, msg);
			},

			"TrueViaInt": function TrueViaInt(){
				var idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					input = [[1]],
					obj = {$anyElementTrue:input},
					expr = Expression.parseExpression("$anyElementTrue", obj),
					result = expr.evaluate({}),
					expected = true,
					msg = errMsg("$anyElementTrue", input, expr.serialize(false), expected, result);
				assert.equal(result, expected, msg);
			},

			"FalseViaInt": function FalseViaInt(){
				var idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					input = [[0]],
					obj = {$anyElementTrue:input},
					expr = Expression.parseExpression("$anyElementTrue", obj),
					result = expr.evaluate({}),
					expected = true,
					msg = errMsg("$anyElementTrue", input, expr.serialize(false), expected, result);
				assert.equal(result, expected, msg);
			},

			"Null": function FalseViaInt(){
				var idGenerator = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGenerator),
					input = [null],
					obj = {$anyElementTrue:input},
					expr = Expression.parseExpression("$anyElementTrue", obj);
				assert.throws(function() {
					result = expr.evaluate({});
				});
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
