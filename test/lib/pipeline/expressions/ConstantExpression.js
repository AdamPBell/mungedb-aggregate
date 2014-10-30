"use strict";
var assert = require("assert"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression");


module.exports = {

	"ConstantExpression": {

		"constructor() / #evaluate": {

			"should be able to construct from a value type": function testCreate(){
				assert.strictEqual(new ConstantExpression(5).evaluateInternal({}), 5);
			}

			//TODO: CreateFromBsonElement ? ?? ???

		},

// TODO: the constructor() tests this so not really needed here
//		"#evaluate()": {
//		},

		"#optimize()": {

			"should not optimize anything": function testOptimize(){
				var expr = new ConstantExpression(5);
				assert.strictEqual(expr, expr.optimize());
			}

		},

		"#addDependencies()": {

			"should return nothing": function testDependencies(){
				assert.strictEqual(new ConstantExpression(5).addDependencies(), undefined);
			}

		},

		"#toJSON()": {

			"should output proper JSON": function testJson(){
				var expr = new ConstantExpression(5);
				assert.strictEqual(expr.serialize(), 5);
				assert.deepEqual(expr.serialize(true), {$const:5});
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
