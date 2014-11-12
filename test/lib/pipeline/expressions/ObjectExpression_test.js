"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ObjectExpression = require("../../../../lib/pipeline/expressions/ObjectExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	AndExpression = require("../../../../lib/pipeline/expressions/AndExpression"),
	Variables = require("../../../../lib/pipeline/expressions/Variables"),
	DepsTracker = require("../../../../lib/pipeline/DepsTracker");

//SKIPPED: assertBinaryEqual
//SKIPPED: toJson
function expressionToJson(expr) {
	return expr.serialize(false);
}
//SKIPPED: fromJson
//SKIPPED: valueFromBson

function assertDependencies(expectedDependencies, expression, includePath) {
	if (includePath === undefined) includePath = true;
	var path = [],
		dependencies = new DepsTracker();
	expression.addDependencies(dependencies, includePath ? path : undefined);
	var bab = Object.keys(dependencies.fields);
	assert.deepEqual(bab.sort(), expectedDependencies.sort());
	assert.strictEqual(dependencies.needWholeDocument, false);
	assert.strictEqual(dependencies.needTextScore, false);
}

/// An assertion for `ObjectExpression` instances based on Mongo's `ExpectedResultBase` class
function assertExpectedResult(args) {
	{// check for required args
		if (args === undefined) throw new TypeError("missing arg: `args` is required");
		if (!("expected" in args)) throw new Error("missing arg: `args.expected` is required");
		if (!("expectedDependencies" in args)) throw new Error("missing arg: `args.expectedDependencies` is required");
		if (!("expectedJsonRepresentation" in args)) throw new Error("missing arg: `args.expectedJsonRepresentation` is required");
	}
	{// base args if none provided
		if (args.source === undefined) args.source = {_id:0, a:1, b:2};
		if (args.expectedIsSimple === undefined) args.expectedIsSimple = true;
		if (args.expression === undefined) args.expression = ObjectExpression.createRoot(); //NOTE: replace prepareExpression + _expression=
	}
	// run implementation
	var doc = args.source,
		result = {},
		vars = new Variables(0, doc);
	args.expression.addToDocument(result, doc, vars);
	assert.deepEqual(result, args.expected);
	assertDependencies(args.expectedDependencies, args.expression);
	assert.deepEqual(expressionToJson(args.expression), args.expectedJsonRepresentation);
	assert.deepEqual(args.expression.isSimple(), args.expectedIsSimple);
}

exports.ObjectExpression = {

	"constructor()": {

		"should return instance if given arg": function() {
			assert(new ObjectExpression(false) instanceof Expression);
			assert(new ObjectExpression(true) instanceof Expression);
		},

		"should throw Error when constructing without args": function() {
			assert.throws(function() {
				new ObjectExpression();
			});
		},

	},

	"#addDependencies": {

		"should be able to get dependencies for non-inclusion expressions": function nonInclusionDependencies() {
			/** Dependencies for non inclusion expressions. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a", ConstantExpression.create(5));
			assertDependencies(["_id"], expr, true);
			assertDependencies([], expr, false);
			expr.addField("b", FieldPathExpression.create("c.d"));
			assertDependencies(["_id", "c.d"], expr, true);
			assertDependencies(["c.d"], expr, false);
		},

		"should be able to get dependencies for inclusion expressions": function inclusionDependencies() {
			/** Dependencies for inclusion expressions. */
			var expr = ObjectExpression.createRoot();
			expr.includePath("a");
			assertDependencies(["_id", "a"], expr, true);
			var unused = new DepsTracker();
			assert.throws(function() {
				expr.addDependencies(unused);
			}, Error);
		},

	},

	"#serialize": {

		"should be able to convert to JSON representation and have constants represented by expressions": function json() {
			/** Serialize to a BSONObj, with constants represented by expressions. */
			var expr = ObjectExpression.createRoot();
			expr.addField("foo.a", ConstantExpression.create(5));
			assert.deepEqual({foo:{a:{$const:5}}}, expr.serialize());
		},

	},

	"#optimize": {

		"should be able to optimize expression and sub-expressions": function optimize() {
			/** Optimizing an object expression optimizes its sub expressions. */
			var expr = ObjectExpression.createRoot();
			// Add inclusion.
			expr.includePath("a");
			// Add non inclusion.
			var andExpr = new AndExpression();
			expr.addField("b", andExpr);
			expr.optimize();
			// Optimizing 'expression' optimizes its non inclusion sub expressions, while
			// inclusion sub expressions are passed through.
			assert.deepEqual({a:true, b:{$const:true}}, expressionToJson(expr));
		},

	},

	"#evaluate()": {

		"should be able to provide an empty object": function empty() {
			/** Empty object spec. */
			var expr = ObjectExpression.createRoot();
			assertExpectedResult({
				expression: expr,
				expected: {_id:0},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {}
			});
		},

		"should be able to include 'a' field only": function include() {
			/** Include 'a' field only. */
			var expr = ObjectExpression.createRoot();
			expr.includePath("a");
			assertExpectedResult({
				expression: expr,
				expected: {_id:0, a:1},
				expectedDependencies: ["_id", "a"],
				expectedJsonRepresentation: {a:true}
			});
		},

		"should NOT be able to include missing 'a' field": function missingInclude() {
			/** Cannot include missing 'a' field. */
			var expr = ObjectExpression.createRoot();
			expr.includePath("a");
			assertExpectedResult({
				source: {_id:0, b:2},
				expression: expr,
				expected: {_id:0},
				expectedDependencies: ["_id", "a"],
				expectedJsonRepresentation: {a:true}
			});
		},

		"should be able to include '_id' field only": function includeId() {
			/** Include '_id' field only. */
			var expr = ObjectExpression.createRoot();
			expr.includePath("_id");
			assertExpectedResult({
				expression: expr,
				expected: {_id:0},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {_id:true}
			});
		},

		"should be able to exclude '_id' field": function excludeId() {
			/** Exclude '_id' field. */
			var expr = ObjectExpression.createRoot();
			expr.includePath("b");
			expr.excludeId = true;
			assertExpectedResult({
				expression: expr,
				expected: {b:2},
				expectedDependencies: ["b"],
				expectedJsonRepresentation: {_id:false, b:true}
			});
		},

		"should be able to include fields in source document order regardless of inclusion order": function sourceOrder() {
			/** Result order based on source document field order, not inclusion spec field order. */
			var expr = ObjectExpression.createRoot();
			expr.includePath("b");
			expr.includePath("a");
			assertExpectedResult({
				expression: expr,
				get expected() { return this.source; },
				expectedDependencies: ["_id", "a", "b"],
				expectedJsonRepresentation: {b:true, a:true}
			});
		},

		"should be able to include a nested field": function includeNested() {
			/** Include a nested field. */
			var expr = ObjectExpression.createRoot();
			expr.includePath("a.b");
			assertExpectedResult({
				expression: expr,
				expected: {_id:0, a:{b:5}},
				source: {_id:0, a:{b:5, c:6}, z:2},
				expectedDependencies: ["_id", "a.b"],
				expectedJsonRepresentation: {a:{b:true}}
			});
		},

		"should be able to include two nested fields": function includeTwoNested() {
			/** Include two nested fields. */
			var expr = ObjectExpression.createRoot();
			expr.includePath("a.b");
			expr.includePath("a.c");
			assertExpectedResult({
				expression: expr,
				expected: {_id:0, a:{b:5, c:6}},
				source: {_id:0, a:{b:5,c:6}, z:2},
				expectedDependencies: ["_id", "a.b", "a.c"],
				expectedJsonRepresentation: {a:{b:true, c:true}}
			});
		},

		"should be able to include two fields nested within different parents": function includeTwoParentNested() {
			/** Include two fields nested within different parents. */
			var expr = ObjectExpression.createRoot();
			expr.includePath("a.b");
			expr.includePath("c.d");
			assertExpectedResult({
				expression: expr,
				expected: {_id:0, a:{b:5}, c:{d:6}},
				source: {_id:0, a:{b:5}, c:{d:6}, z:2},
				expectedDependencies: ["_id", "a.b", "c.d"],
				expectedJsonRepresentation: {a:{b:true}, c:{d:true}}
			});
		},

		"should be able to attempt to include a missing nested field": function includeMissingNested() {
			/** Attempt to include a missing nested field. */
			var expr = ObjectExpression.createRoot();
			expr.includePath("a.b");
			assertExpectedResult({
				expression: expr,
				expected: {_id:0, a:{}},
				source: {_id:0, a:{c:6}, z:2},
				expectedDependencies: ["_id", "a.b"],
				expectedJsonRepresentation: {a:{b:true}}
			});
		},

		"should be able to attempt to include a nested field within a non object": function includeNestedWithinNonObject() {
			/** Attempt to include a nested field within a non object. */
			var expr = ObjectExpression.createRoot();
			expr.includePath("a.b");
			assertExpectedResult({
				expression: expr,
				expected: {_id:0},
				source: {_id:0, a:2, z:2},
				expectedDependencies: ["_id", "a.b"],
				expectedJsonRepresentation: {a:{b:true}}
			});
		},

		"should be able to include a nested field within an array": function includeArrayNested() {
			/** Include a nested field within an array. */
			var expr = ObjectExpression.createRoot();
			expr.includePath("a.b");
			assertExpectedResult({
				expression: expr,
				expected: {_id:0,a:[{b:5},{b:2},{}]},
				source: {_id:0,a:[{b:5,c:6},{b:2,c:9},{c:7},[],2],z:1},
				expectedDependencies: ["_id", "a.b"],
				expectedJsonRepresentation: {a:{b:true}}
			});
		},

		"should NOT include non-root '_id' field implicitly": function excludeNonRootId() {
			/** Don't include not root '_id' field implicitly. */
			var expr = ObjectExpression.createRoot();
			expr.includePath("a.b");
			assertExpectedResult({
				expression: expr,
				source: {_id:0, a:{_id:1, b:1}},
				expected: {_id:0, a:{b:1}},
				expectedDependencies: ["_id", "a.b"],
				expectedJsonRepresentation: {a:{b:true}}
			});
		},

		"should project a computed expression": function computed() {
			/** Project a computed expression. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a", ConstantExpression.create(5));
			assertExpectedResult({
				expression: expr,
				source: {_id:0},
				expected: {_id:0, a:5},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {a:{$const:5}},
				expectedIsSimple: false
			});
		},

		"should project a computed expression replacing an existing field": function computedReplacement() {
			/** Project a computed expression replacing an existing field. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a", ConstantExpression.create(5));
			assertExpectedResult({
				expression: expr,
				source: {_id:0, a:99},
				expected: {_id:0, a:5},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {a:{$const:5}},
				expectedIsSimple: false
			});
		},

		"should NOT be able to project an undefined value": function computedUndefined() {
			/** An undefined value is passed through */
			var expr = ObjectExpression.createRoot();
			expr.addField("a", ConstantExpression.create(undefined));
			assertExpectedResult({
				expression: expr,
				source: {_id:0},
				expected: {_id:0, a:undefined},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {a:{$const:undefined}},
				expectedIsSimple: false
			});
		},

		"should project a computed expression replacing an existing field with Undefined": function computedUndefinedReplacement() {
			/** Project a computed expression replacing an existing field with Undefined. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a", ConstantExpression.create(undefined));
			assertExpectedResult({
				expression: expr,
				source: {_id:0, a:99},
				expected: {_id:0, a:undefined},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {a:{$const:undefined}},
				expectedIsSimple: false
			});
		},

		"should project a null value": function computedNull() {
			/** A null value is projected. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a", ConstantExpression.create(null));
			assertExpectedResult({
				expression: expr,
				source: {_id:0},
				expected: {_id:0, a:null},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {a:{$const:null}},
				expectedIsSimple: false
			});
		},

		"should project a nested value": function computedNested() {
			/** A nested value is projected. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a.b", ConstantExpression.create(5));
			assertExpectedResult({
				expression: expr,
				source: {_id:0},
				expected: {_id:0, a:{b:5}},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {a:{b:{$const:5}}},
				expectedIsSimple: false
			});
		},

		"should project a field path": function computedFieldPath() {
			/** A field path is projected. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a", FieldPathExpression.create("x"));
			assertExpectedResult({
				expression: expr,
				source: {_id:0, x:4},
				expected: {_id:0, a:4},
				expectedDependencies: ["_id", "x"],
				expectedJsonRepresentation: {a:"$x"},
				expectedIsSimple: false
			});
		},

		"should project a nested field path": function computedNestedFieldPath() {
			/** A nested field path is projected. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a.b", FieldPathExpression.create("x.y"));
			assertExpectedResult({
				expression: expr,
				source: {_id:0, x:{y:4}},
				expected: {_id:0, a:{b:4}},
				expectedDependencies: ["_id", "x.y"],
				expectedJsonRepresentation: {a:{b:"$x.y"}},
				expectedIsSimple: false
			});
		},

		"should NOT project an empty subobject expression for a missing field": function emptyNewSubobject() {
			/** An empty subobject expression for a missing field is not projected. */
			var expr = ObjectExpression.createRoot();
			// Create a sub expression returning an empty object.
			var subExpr = ObjectExpression.create();
			subExpr.addField("b", FieldPathExpression.create("a.b"));
			expr.addField("a", subExpr);
			assertExpectedResult({
				expression: expr,
				source: {_id:0},
				expected: {_id:0},
				expectedDependencies: ["_id", "a.b"],
				expectedJsonRepresentation: {a:{b:"$a.b"}},
				expectedIsSimple: false
			});
		},

		"should project a non-empty new subobject": function nonEmptyNewSubobject() {
			/** A non empty subobject expression for a missing field is projected. */
			var expr = ObjectExpression.createRoot();
			// Create a sub expression returning an empty object.
			var subExpr = ObjectExpression.create();
			subExpr.addField("b", ConstantExpression.create(6));
			expr.addField("a", subExpr);
			assertExpectedResult({
				expression: expr,
				source: {_id:0},
				expected: {_id:0, a:{b:6}},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {a:{b:{$const:6}}},
				expectedIsSimple: false
			});
		},

		"should project two computed fields in a common parent": function adjacentDottedComputedFields() {
			/** Two computed fields within a common parent. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a.b", ConstantExpression.create(6));
			expr.addField("a.c", ConstantExpression.create(7));
			assertExpectedResult({
				expression: expr,
				source: {_id:0},
				expected: {_id:0, a:{b:6, c:7}},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {a:{b:{$const:6},c:{$const:7}}},
				expectedIsSimple: false
			});
		},

		"should project two computed fields in a common parent (w/ one case dotted)": function adjacentDottedAndNestedComputedFields() {
			/** Two computed fields within a common parent, in one case dotted. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a.b", ConstantExpression.create(6));
			var subExpr = ObjectExpression.create();
			subExpr.addField("c", ConstantExpression.create(7));
			expr.addField("a", subExpr);
			assertExpectedResult({
				expression: expr,
				source: {_id:0},
				expected: {_id:0, a:{b:6, c:7}},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {a:{b:{$const:6},c:{$const:7}}},
				expectedIsSimple: false
			});
		},

		"should project two computed fields in a common parent (in another case dotted)": function adjacentNestedAndDottedComputedFields() {
			/** Two computed fields within a common parent, in another case dotted. */
			var expr = ObjectExpression.createRoot();
			var subExpr = ObjectExpression.create();
			subExpr.addField("b", ConstantExpression.create(6));
			expr.addField("a", subExpr);
			expr.addField("a.c", ConstantExpression.create(7));
			assertExpectedResult({
				expression: expr,
				source: {_id:0},
				expected: {_id:0, a:{b:6, c:7}},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {a:{b:{$const:6},c:{$const:7}}},
				expectedIsSimple: false
			});
		},

		"should project two computed fields in a common parent (nested rather than dotted)": function adjacentNestedComputedFields() {
			/** Two computed fields within a common parent, nested rather than dotted. */
			var expr = ObjectExpression.createRoot();
			var subExpr1 = ObjectExpression.create();
			subExpr1.addField("b", ConstantExpression.create(6));
			expr.addField("a", subExpr1);
			var subExpr2 = ObjectExpression.create();
			subExpr2.addField("c", ConstantExpression.create(7));
			expr.addField("a", subExpr2);
			assertExpectedResult({
				expression: expr,
				source: {_id:0},
				expected: {_id:0, a:{b:6, c:7}},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {a:{b:{$const:6},c:{$const:7}}},
				expectedIsSimple: false
			});
		},

		"should project multiple nested fields out of order without affecting output order": function adjacentNestedOrdering() {
			/** Field ordering is preserved when nested fields are merged. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a.b", ConstantExpression.create(6));
			var subExpr = ObjectExpression.create();
			// Add field 'd' then 'c'.  Expect the same field ordering in the result doc.
			subExpr.addField("d", ConstantExpression.create(7));
			subExpr.addField("c", ConstantExpression.create(8));
			expr.addField("a", subExpr);
			assertExpectedResult({
				expression: expr,
				source: {_id:0},
				expected: {_id:0, a:{b:6, d:7, c:8}},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {a:{b:{$const:6},d:{$const:7},c:{$const:8}}},
				expectedIsSimple: false
			});
		},

		"should project adjacent fields two levels deep": function multipleNestedFields() {
			/** Adjacent fields two levels deep. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a.b.c", ConstantExpression.create(6));
			var bSubExpression = ObjectExpression.create();
			bSubExpression.addField("d", ConstantExpression.create(7));
			var aSubExpression = ObjectExpression.create();
			aSubExpression.addField("b", bSubExpression);
			expr.addField("a", aSubExpression);
			assertExpectedResult({
				expression: expr,
				source: {_id:0},
				expected: {_id:0, a:{b:{c:6, d:7}}},
				expectedDependencies: ["_id"],
				expectedJsonRepresentation: {a:{b:{c:{$const:6},d:{$const:7}}}},
				expectedIsSimple: false
			});
		},

		"should error if two expressions generate the same field": function conflictingExpressionFields() {
			/** Two expressions cannot generate the same field. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a", ConstantExpression.create(5));
			assert.throws(function() {
				expr.addField("a", ConstantExpression.create(6)); // Duplicate field.
			}, Error);
		},

		"should error if an expression field conflicts with an inclusion field": function conflictingInclusionExpressionFields() {
			/** An expression field conflicts with an inclusion field. */
			var expr = ObjectExpression.createRoot();
			expr.includePath("a");
			assert.throws(function() {
				expr.addField("a", ConstantExpression.create(6));
			}, Error);
		},

		"should error if an inclusion field conflicts with an expression field": function conflictingExpressionInclusionFields() {
			/** An inclusion field conflicts with an expression field. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a", ConstantExpression.create(5));
			assert.throws(function() {
				expr.includePath("a");
			}, Error);
		},

		"should error if an object expression conflicts with a constant expression": function conflictingObjectConstantExpressionFields() {
			/** An object expression conflicts with a constant expression. */
			var expr = ObjectExpression.createRoot();
			var subExpr = ObjectExpression.create();
			subExpr.includePath("b");
			expr.addField("a", subExpr);
			assert.throws(function() {
				expr.addField("a.b", ConstantExpression.create(6));
			}, Error);
		},

		"should error if a constant expression conflicts with an object expression": function conflictingConstantObjectExpressionFields() {
			/** A constant expression conflicts with an object expression. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a.b", ConstantExpression.create(6));
			var subExpr = ObjectExpression.create();
			subExpr.includePath("b");
			assert.throws(function() {
				expr.addField("a", subExpr);
			}, Error);
		},

		"should error if two nested expressions cannot generate the same field": function conflictingNestedFields() {
			/** Two nested expressions cannot generate the same field. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a.b", ConstantExpression.create(5));
			assert.throws(function() {
				expr.addField("a.b", ConstantExpression.create(6));	// Duplicate field.
			}, Error);
		},

		"should error if an expression is created for a subfield of another expression": function conflictingFieldAndSubfield() {
			/** An expression cannot be created for a subfield of another expression. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a", ConstantExpression.create(5));
			assert.throws(function() {
				expr.addField("a.b", ConstantExpression.create(5));
			}, Error);
		},

		"should error if an expression is created for a nested field of another expression.": function conflictingFieldAndNestedField() {
			/** An expression cannot be created for a nested field of another expression. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a", ConstantExpression.create(5));
			var subExpr = ObjectExpression.create();
			subExpr.addField("b", ConstantExpression.create(5));
			assert.throws(function() {
				expr.addField("a", subExpr);
			}, Error);
		},

		"should error if an expression is created for a parent field of another expression": function conflictingSubfieldAndField() {
			/** An expression cannot be created for a parent field of another expression. */
			var expr = ObjectExpression.createRoot();
			expr.addField("a.b", ConstantExpression.create(5));
			assert.throws(function() {
				expr.addField("a", ConstantExpression.create(5));
			}, Error);
		},

		"should error if an expression is created for a parent of a nested field": function conflictingNestedFieldAndField() {
			/** An expression cannot be created for a parent of a nested field. */
			var expr = ObjectExpression.createRoot();
			var subExpr = ObjectExpression.create();
			subExpr.addField("b", ConstantExpression.create(5));
			expr.addField("a", subExpr);
			assert.throws(function() {
				expr.addField("a", ConstantExpression.create(5));
			}, Error);
		},

		"should be able to evaluate expressions in general": function evaluate() {
			/**
			 * evaluate() does not supply an inclusion document.
			 * Inclusion spec'd fields are not included.
			 * (Inclusion specs are not generally expected/allowed in cases where evaluate is called instead of addToDocument.)
			 */
			var expr = ObjectExpression.createRoot();
			expr.includePath("a");
			expr.addField("b", ConstantExpression.create(5));
			expr.addField("c", FieldPathExpression.create("a"));
			var res = expr.evaluateInternal(new Variables(1, {_id:0, a:1}));
			assert.deepEqual({"b":5, "c":1}, res);
		},

	},

};
