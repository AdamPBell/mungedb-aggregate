"use strict";
var assert = require("assert"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	NaryExpression = require("../../../../lib/pipeline/expressions/NaryExpression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


// A dummy child of NaryExpression used for testing
var TestableExpression = (function(){
	// CONSTRUCTOR
	var klass = function TestableExpression(operands, haveFactory){
		base.call(this);
		if (operands) {
			var self = this;
			operands.forEach(function(operand) {
				self.addOperand(operand);
			});
		}
		this.haveFactory = !!haveFactory;
	}, base = NaryExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

	// PROTOTYPE MEMBERS
	proto.evaluateInternal = function evaluateInternal(vps) {
		// Just put all the values in a list.  This is not associative/commutative so
		// the results will change if a factory is provided and operations are reordered.
		return this.operands.map(function(operand) {
			return operand.evaluateInternal(vps);
		});
	};

	proto.isAssociativeAndCommutative = function isAssociativeAndCommutative(){
		return this.isAssociativeAndCommutative;
	};

	proto.getOpName = function getOpName() {
		return "$testable";
	};

	klass.createFromOperands = function(operands) {
		var vps = new VariablesParseState(new VariablesIdGenerator()),
			testable = new TestableExpression();
		operands.forEach(function(x) {
			testable.addOperand(Expression.parseOperand(x, vps));
		});
		return testable;
	};

	return klass;
})();


module.exports = {

	"NaryExpression": {

		"constructor()": {

		},

		"#optimize()": {

			"should suboptimize": function() {
				var testable = TestableExpression.createFromOperands([{"$and": []}, "$abc"], true);
				testable = testable.optimize();
				assert.deepEqual(testable.serialize(), {$testable: [true,"$abc"]});
			},
			"should fold constants": function() {
				var testable = TestableExpression.createFromOperands([1,2], true);
				testable = testable.optimize();
				assert.deepEqual(testable.serialize(), {$const: [1,2]});
			},

			"should place constants at the end of operands array": function() {
				var testable = TestableExpression.createFromOperands([55,65, "$path"], true);
				testable = testable.optimize();
				assert.deepEqual(testable.serialize(), {$testable:["$path", [55,66]]});
			},

			"should flatten two layers" : function() {
				var testable = TestableExpression.createFromOperands([55, "$path", {$add: [5,6,"$q"]}], true);
				testable.addOperand(TestableExpression.createFromOperands([99,100,"$another_path"], true));
				testable = testable.optimize();
				assert.deepEqual(testable.serialize(), {$testable: ["$path", {$add: [5,6,"$q"]}, "$another_path", [55,66,[99,100]]]});
			},

			"should flatten three layers": function(){
				var bottom = TestableExpression.createFromOperands([5,6,"$c"], true),
					middle = TestableExpression.createFromOperands([3,4,"$b"], true).addOperand(bottom),
					top = TestableExpression.createFromOperands([1,2,"$a"], true);
				var testable = top.optimize();
				assert.deepEqual(testable.serialize(), {$testable: ["$a", "$b", "$c", [1,2,[3,4,[5,6]]]]});
			}

		},

		"#addOperand() should be able to add operands to expressions": function testAddOperand(){
			var foo = new TestableExpression([new ConstantExpression(9)]).serialize();
			var bar = new TestableExpression([new ConstantExpression(9)]).serialize();
			var baz = {"$testable":[{"$const":9}]};

			assert.deepEqual(foo,bar);
			assert.deepEqual(foo, baz);
			assert.deepEqual(baz,foo);
			assert.deepEqual(new TestableExpression([new ConstantExpression(9)]).serialize(), {"$testable":[{"$const":9}]});
			assert.deepEqual(new TestableExpression([new FieldPathExpression("ab.c")]).serialize(), {$testable:["$ab.c"]});
		},


		"#serialize() should convert an object to json": function(){
			var testable = new TestableExpression();
			testable.addOperand(new ConstantExpression(5));
			assert.deepEqual({foo: testable.serialize()}, {foo:{$testable:[{$const: 5}]}});
		},


		//the following test case is eagerly awaiting ObjectExpression
		"#addDependencies()": function testDependencies(){
			var testableExpr = new TestableExpression();
			var deps = {};
			// no arguments
			testableExpr.addDependencies(deps);
			assert.deepEqual(deps, {});

			// add a constant argument
			testableExpr.addOperand(new ConstantExpression(1));

			deps = {};
			testableExpr.addDependencies(deps);
			assert.deepEqual(deps, {});

			// add a field path argument
			testableExpr.addOperand(new FieldPathExpression("ab.c"));
			deps = {};
			testableExpr.addDependencies(deps);
			assert.deepEqual(deps, {"ab.c":1});

			// add an object expression
			testableExpr.addOperand(Expression.parseObject({a:"$x",q:"$r"}, new Expression.ObjectCtx({isDocumentOk:1})));
			deps = {};
			testableExpr.addDependencies(deps);
			assert.deepEqual(deps, {"ab.c":1, "x":1, "r":1});
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
