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

		"#checkArgCountRange() sans operands": {
			"should fail with Error if there are no arguments": function(){
				var testableExpr = new TestableExpression();
				assert.throws(function() {
					testableExpr.checkArgCountRange(2, 4);
				});
			},
			"should accept if there are no operands but the lower range is 0": function(){
				var testableExpr = new TestableExpression();
				assert.doesNotThrow(function() {
					testableExpr.checkArgCountRange(0, 4);
				});
			}
		},

		"#checkArgCountRange()": {
			before: function() {
				this.testableExpr = new TestableExpression();
				this.testableExpr.addOperand(new ConstantExpression("uno"));
				this.testableExpr.addOperand(new ConstantExpression("dos"));
				this.testableExpr.addOperand(new ConstantExpression("tres"));
			},

			"should throw Error if the number of arguments is too low": function () {
				var t = this.testableExpr;
				assert.throws(function() {
					t.checkArgCountRange(4, 6);
				});
			},
			"should throw Error if the number of arguments is too high": function () {
				var t = this.testableExpr;
				assert.throws(function() {
					t.checkArgCountRange(1, 2);
				});
			},
			"should accept if the number of arguments equals the minimum": function () {
				var t = this.testableExpr;
				assert.doesNotThrow(function() {
					t.checkArgCountRange(3, 5);
				});
			},
			"should accept if the number of arguments equals the maximum": function () {
				var t = this.testableExpr;
				assert.doesNotThrow(function() {
					t.checkArgCountRange(1, 3);
				});
			},
			"should accept if the number of arguments falls within the range": function () {
				var t = this.testableExpr;
				assert.doesNotThrow(function() {
					t.checkArgCountRange(2, 4);
				});
			}
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
