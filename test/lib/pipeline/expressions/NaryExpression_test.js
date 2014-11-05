"use strict";

var assert = require("assert"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	Expression = require("../../../../lib/pipeline/expressions/Expression"),
	NaryExpression = require("../../../../lib/pipeline/expressions/NaryExpression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	AndExpression = require("../../../../lib/pipeline/expressions/AndExpression"), //jshint ignore:line
	AddExpression = require("../../../../lib/pipeline/expressions/AddExpression"), //jshint ignore:line
	DepsTracker = require("../../../../lib/pipeline/DepsTracker"),
	utils = require("./utils"),
	constify = utils.constify,
	expressionToJson = utils.expressionToJson;


// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));


// A dummy child of NaryExpression used for testing
var Testable = (function(){
	var klass = function Testable(isAssociativeAndCommutative){
		this._isAssociativeAndCommutative = isAssociativeAndCommutative;
		base.call(this);
	}, base = NaryExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

	proto.evaluateInternal = function evaluateInternal(vars) {
		// Just put all the values in a list.  This is not associative/commutative so
		// the results will change if a factory is provided and operations are reordered.
		var values = [];
		for (var i = 0, l = this.operands.length; i < l; i++) {
			values.push(this.operands[i].evaluateInternal(vars));
		}
		return values;
	};

	proto.getOpName = function getOpName() {
		return "$testable";
	};

	proto.isAssociativeAndCommutative = function isAssociativeAndCommutative(){
		return this._isAssociativeAndCommutative;
	};

	klass.create = function create(associativeAndCommutative) {
		return new Testable(Boolean(associativeAndCommutative));
	};

	klass.factory = function factory() {
		return new Testable(true);
	};

	klass.createFromOperands = function(operands, haveFactory) {
		if (haveFactory === undefined) haveFactory = false;
		var idGenerator = new VariablesIdGenerator(),
			vps = new VariablesParseState(idGenerator),
			testable = Testable.create(haveFactory);
		for (var i = 0, l = operands.length; i < l; i++) {
			var element = operands[i];
			testable.addOperand(Expression.parseOperand(element, vps));
		}
		return testable;
	};

	proto.assertContents = function assertContents(expectedContents) {
		assert.deepEqual(constify({$testable:expectedContents}), expressionToJson(this));
	};

	return klass;
})();


exports.NaryExpression = {

	".parseArguments()": {

		"should parse a fieldPathExpression": function() {
			var vps = new VariablesParseState(new VariablesIdGenerator()),
				parsedArguments = NaryExpression.parseArguments("$field.path.expression", vps);
			assert.equal(parsedArguments.length, 1);
			assert(parsedArguments[0] instanceof FieldPathExpression);
		},

		"should parse an array of fieldPathExpressions": function() {
			var vps = new VariablesParseState(new VariablesIdGenerator()),
				parsedArguments = NaryExpression.parseArguments(["$field.path.expression", "$another.FPE"], vps);
			assert.equal(parsedArguments.length, 2);
			assert(parsedArguments[0] instanceof FieldPathExpression);
			assert(parsedArguments[1] instanceof FieldPathExpression);
		},

	},

	/** Adding operands to the expression. */
	"AddOperand": function testAddOperand() {
		var testable = Testable.create();
		testable.addOperand(ConstantExpression.create(9));
		testable.assertContents([9]);
		testable.addOperand(FieldPathExpression.create("ab.c"));
		testable.assertContents([9, "$ab.c"]);
	},

	/** Dependencies of the expression. */
	"Dependencies": function testDependencies() {
		var testable = Testable.create();

		var assertDependencies = function assertDependencies(expectedDeps, expr) {
			var deps = new DepsTracker();
			expr.addDependencies(deps);
			var depsJson = Object.keys(deps.fields).sort();
			assert.deepEqual(depsJson, expectedDeps);
			assert.strictEqual(deps.needWholeDocument, false);
			assert.strictEqual(deps.needTextScore, false);
		};

		// No arguments.
		assertDependencies([], testable);

		// Add a constant argument.
		testable.addOperand(ConstantExpression.create(1));
		assertDependencies([], testable);

		// Add a field path argument.
		testable.addOperand(FieldPathExpression.create("ab.c"));
		assertDependencies(["ab.c"], testable);

		// Add an object expression.
		var spec = {a:"$x", q:"$r"},
			specElement = spec,
			ctx = new Expression.ObjectCtx({isDocumentOk:true}),
			vps = new VariablesParseState(new VariablesIdGenerator());
		testable.addOperand(Expression.parseObject(specElement, ctx, vps));
		assertDependencies(["ab.c", "r", "x"], testable);
	},

	/** Serialize to an object. */
	"AddToJsonObj": function testAddToJsonObj() {
		var testable = Testable.create();
		testable.addOperand(new ConstantExpression(5));
		assert.deepEqual(
			{foo:{$testable:[{$const:5}]}},
			{foo:testable.serialize(false)}
		);
	},

	/** Serialize to an array. */
	"AddToJsonArray": function testAddToJsonArray() {
		var testable = Testable.create();
		testable.addOperand(new ConstantExpression(5));
		assert.deepEqual(
			[{$testable:[{$const:5}]}],
			[testable.serialize(false)]
		);
	},

	/** One operand is optimized to a constant, while another is left as is. */
	"OptimizeOneOperand": function testOptimizeOneOperand() {
		var spec = [{$and:[]}, "$abc"],
			testable = Testable.createFromOperands(spec);
		testable.assertContents(spec);
		assert.strictEqual(testable, testable.optimize());
		testable.assertContents([true, "$abc"]);
	},

	/** All operands are constants, and the operator is evaluated with them. */
	"EvaluateAllConstantOperands": function testEvaluateAllConstantOperands() {
		var spec = [1, 2],
			testable = Testable.createFromOperands(spec);
		testable.assertContents(spec);
		var optimized = testable.optimize();
		assert.notStrictEqual(testable, optimized);
		assert.deepEqual({$const:[1,2]}, expressionToJson(optimized));
	},

	"NoFactoryOptimize": {
		// Without factory optimization, optimization will not produce a new expression.

		/** A string constant prevents factory optimization. */
		"StringConstant": function testStringConstant() {
			var testable = Testable.createFromOperands(["abc", "def", "$path"], true);
			assert.strictEqual(testable, testable.optimize());
		},

		/** A single (instead of multiple) constant prevents optimization.  SERVER-6192 */
		"SingleConstant": function testSingleConstant() {
			var testable = Testable.createFromOperands([55, "$path"], true);
			assert.strictEqual(testable, testable.optimize());
		},

		/** Factory optimization is not used without a factory. */
		"NoFactory": function testNoFactory() {
			var testable = Testable.createFromOperands([55, 66, "$path"], false);
			assert.strictEqual(testable, testable.optimize());
		},

	},

	/** Factory optimization separates constant from non constant expressions. */
	"FactoryOptimize": function testFactoryOptimize() {
		// The constant expressions are evaluated separately and placed at the end.
		var testable = Testable.createFromOperands([55, 66, "$path"], true),
			optimized = testable.optimize();
		assert.deepEqual(constify({$testable:["$path", [55, 66]]}), expressionToJson(optimized));
	},

	/** Factory optimization flattens nested operators of the same type. */
	"FlattenOptimize": function testFlattenOptimize() {
		var testable = Testable.createFromOperands(
				[55, "$path", {$add:[5,6,"$q"]}, 66],
			true);
		// Add a nested $testable operand.
		testable.addOperand(Testable.createFromOperands(
				[99, 100, "$another_path"],
			true)
		);
		var optimized = testable.optimize();
		assert.deepEqual(
			constify({$testable:[
				// non constant parts
				"$path",
				{$add:["$q", 11]},
				"$another_path",
				// constant part last
				[55, 66, [99, 100]]
			]}),
			expressionToJson(optimized)
		);
	},

	/** Three layers of factory optimization are flattened. */
	"FlattenThreeLayers": function testFlattenThreeLayers() {
		var top = Testable.createFromOperands([1, 2, "$a"], true),
			nested = Testable.createFromOperands([3, 4, "$b"], true);
		nested.addOperand(Testable.createFromOperands([5, 6, "$c"], true));
		top.addOperand(nested);
		var optimized = top.optimize();
		assert.deepEqual(
			constify({$testable: ["$a", "$b", "$c", [1, 2, [3, 4, [5, 6]]]]}),
			expressionToJson(optimized)
		);
	},

};
