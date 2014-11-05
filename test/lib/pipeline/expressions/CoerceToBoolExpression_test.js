"use strict";
var assert = require("assert"),
	CoerceToBoolExpression = require("../../../../lib/pipeline/expressions/CoerceToBoolExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression"),
	DepsTracker = require("../../../../lib/pipeline/DepsTracker");

exports.CoerceToBoolExpression = {

	"constructor()": {

		"should create instance": function() {
			var nested = ConstantExpression.create(5);
			assert(new CoerceToBoolExpression(nested) instanceof Expression);
		},

		"should throw Error unless one arg": function() {
			assert.throws(function() {
				new CoerceToBoolExpression();
			});
			assert.throws(function() {
				new CoerceToBoolExpression("foo", "bar");
			});
		},

	},

	"#evaluate()": {

		"should return true if nested expression is coerced to true; {$const:5}": function testEvaluateTrue() {
			/** Nested expression coerced to true. */
			var nested = ConstantExpression.create(5),
				expr = CoerceToBoolExpression.create(nested);
			assert.strictEqual(expr.evaluate({}), true);
		},

		"should return false if nested expression is coerced to false; {$const:0}": function testEvaluateFalse() {
			/** Nested expression coerced to false. */
			var expr = CoerceToBoolExpression.create(ConstantExpression.create(0));
			assert.strictEqual(expr.evaluate({}), false);
		},

	},

	"#addDependencies()": {

		"should forward dependencies of nested expression": function testDependencies() {
			/** Dependencies forwarded from nested expression. */
			var nested = FieldPathExpression.create("a.b"),
				expr = CoerceToBoolExpression.create(nested),
				deps = new DepsTracker();
			expr.addDependencies(deps);
			assert.strictEqual( Object.keys(deps.fields).length, 1 );
			assert.strictEqual("a.b" in deps.fields, true);
			assert.strictEqual(deps.needWholeDocument, false);
			assert.strictEqual(deps.needTextScore, false);
		},

	},

	"#serialize": {

		"should be able to output in to JSON Object": function testAddToBsonObj() {
			/** Output to BSONObj. */
			var expr = CoerceToBoolExpression.create(FieldPathExpression.create("foo"));
			// serialized as $and because CoerceToBool isn't an ExpressionNary
			assert.deepEqual({field:{$and:["$foo"]}}, {field:expr.serialize(false)});
		},

		"should be able to output in to JSON Array": function testAddToBsonArray() {
			/** Output to BSONArray. */
			var expr = CoerceToBoolExpression.create(FieldPathExpression.create("foo"));
			// serialized as $and because CoerceToBool isn't an ExpressionNary
			assert.deepEqual([{$and:["$foo"]}], [expr.serialize(false)]);
		},

	},

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
