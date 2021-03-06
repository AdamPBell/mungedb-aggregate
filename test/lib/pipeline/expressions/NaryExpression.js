"use strict";
var assert = require("assert"),
	NaryExpression = require("../../../../lib/pipeline/expressions/NaryExpression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


// A dummy child of NaryExpression used for testing
var TestableExpression = (function(){
	// CONSTRUCTOR
	var klass = module.exports = function TestableExpression(operands, haveFactory){
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
	proto.evaluate = function evaluate(doc) {
		// Just put all the values in a list.  This is not associative/commutative so
		// the results will change if a factory is provided and operations are reordered.
		return this.operands.map(function(operand) {
			return operand.evaluate(doc);
		});
	};

	proto.getFactory = function getFactory(){
		return this.haveFactory ? this.factory : klass;
	};

	proto.getOpName = function getOpName() {
		return "$testable";
	};

	return klass;
})();


module.exports = {

	"NaryExpression": {

		"constructor()": {

		},

		"#optimize()": {

		},

		"#addOperand() should be able to add operands to expressions": function testAddOperand(){
			assert.deepEqual(new TestableExpression([new ConstantExpression(9)]).toJSON(), {$testable:[9]});
			assert.deepEqual(new TestableExpression([new FieldPathExpression("ab.c")]).toJSON(), {$testable:["$ab.c"]});
		},

		"#checkArgLimit() should throw Error iff number of operands is over given limit": function testCheckArgLimit(){
			var testableExpr = new TestableExpression();

			// no arguments
			assert.doesNotThrow(function(){
				testableExpr.checkArgLimit(1);
			});

			// one argument
			testableExpr.addOperand(new ConstantExpression(1));
			assert.throws(function(){
				testableExpr.checkArgLimit(1);
			});
			assert.doesNotThrow(function(){
				testableExpr.checkArgLimit(2);
			});

			// two arguments
			testableExpr.addOperand(new ConstantExpression(2));
			assert.throws(function(){
				testableExpr.checkArgLimit(1);
			});
			assert.throws(function(){
				testableExpr.checkArgLimit(2);
			});
			assert.doesNotThrow(function(){
				testableExpr.checkArgLimit(3);
			});
		},

		"#checkArgCount() should throw Error iff number of operands is not equal to given count": function testCheckArgCount(){
			var testableExpr = new TestableExpression();

			// no arguments
			assert.doesNotThrow(function(){
				testableExpr.checkArgCount(0);
			});
			assert.throws(function(){
				testableExpr.checkArgCount(1);
			});

			// one argument
			testableExpr.addOperand(new ConstantExpression(1));
			assert.throws(function(){
				testableExpr.checkArgCount(0);
			});
			assert.doesNotThrow(function(){
				testableExpr.checkArgCount(1);
			});
			assert.throws(function(){
				testableExpr.checkArgCount(2);
			});

			// two arguments
			testableExpr.addOperand(new ConstantExpression(2));
			assert.throws(function(){
				testableExpr.checkArgCount(1);
			});
			assert.doesNotThrow(function(){
				testableExpr.checkArgCount(2);
			});
			assert.throws(function(){
				testableExpr.checkArgCount(3);
			});
		},

		//the following test case is eagerly awaiting ObjectExpression
		"#addDependencies()": function testDependencies(){
			var testableExpr = new TestableExpression();

			// no arguments
			assert.deepEqual(testableExpr.addDependencies({}), {});

			// add a constant argument
			testableExpr.addOperand(new ConstantExpression(1));
			assert.deepEqual(testableExpr.addDependencies({}), {});

			// add a field path argument
			testableExpr.addOperand(new FieldPathExpression("ab.c"));
			assert.deepEqual(testableExpr.addDependencies({}), {"ab.c":1});

			// add an object expression
			testableExpr.addOperand(Expression.parseObject({a:"$x",q:"$r"}, new Expression.ObjectCtx({isDocumentOk:1})));
			assert.deepEqual(testableExpr.addDependencies({}), {"ab.c":1, "x":1, "r":1});
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
