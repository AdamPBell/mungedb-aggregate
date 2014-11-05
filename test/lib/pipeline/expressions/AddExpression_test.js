"use strict";
var assert = require("assert"),
	Expression = require("../../../../lib/pipeline/expressions/Expression"),
	AddExpression = require("../../../../lib/pipeline/expressions/AddExpression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	ConstantExpression = require("../../../../lib/pipeline/expressions/ConstantExpression");

// Mocha one-liner to make these tests self-hosted
if(!module.parent)return(require.cache[__filename]=null,(new(require("mocha"))({ui:"exports",reporter:"spec",grep:process.env.TEST_GREP})).addFile(__filename).run(process.exit));

var TestBase = function TestBase(overrides) {
		//NOTE: DEVIATION FROM MONGO: using this base class to make things easier to initialize
		for (var key in overrides)
			this[key] = overrides[key];
	},
	ExpectedResultBase = (function() {
		var klass = function ExpectedResultBase() {
			base.apply(this, arguments);
		}, base = TestBase, proto = klass.prototype = Object.create(base.prototype);
		proto.run = function() {
			var expr = new AddExpression();
			this.populateOperands(expr);
			var expectedResult = this.expectedResult instanceof Function ? this.expectedResult() : this.expectedResult;
			if (expectedResult instanceof Date) //NOTE: DEVIATION FROM MONGO: special case for Date
				return assert.strictEqual(Date(expectedResult), Date(expr.evaluate({})));
			assert.strictEqual(expectedResult, expr.evaluate({}));
		};
		return klass;
	})(),
	SingleOperandBase = (function() {
		var klass = function SingleOperandBase() {
			base.apply(this, arguments);
		}, base = ExpectedResultBase, proto = klass.prototype = Object.create(base.prototype);
		proto.populateOperands = function(expr) {
			var operand = this.operand instanceof Function ? this.operand() : this.operand;
			expr.addOperand(ConstantExpression.create(operand));
		};
		proto.expectedResult = function() {
			var operand = this.operand instanceof Function ? this.operand() : this.operand;
			return operand;
		};
		return klass;
	})(),
	TwoOperandBase = (function() {
		var klass = function TwoOperandBase() {
			base.apply(this, arguments);
		}, base = ExpectedResultBase, proto = klass.prototype = Object.create(base.prototype);
		proto.run = function() {
			base.prototype.run.call(this);
            // Now add the operands in the reverse direction.
            this._reverse = true;
			base.prototype.run.call(this);
		};
		proto.populateOperands = function(expr) {
			var operand1 = this.operand1 instanceof Function ? this.operand1() : this.operand1,
				operand2 = this.operand1 instanceof Function ? this.operand2() : this.operand2;
			expr.addOperand(ConstantExpression.create(this._reverse ? operand2 : operand1));
			expr.addOperand(ConstantExpression.create(this._reverse ? operand1 : operand2));
		};
		proto._reverse = false;
		return klass;
	})();

exports.AddExpression = {

	"constructor()": {

		"should construct instance": function() {
			assert(new AddExpression() instanceof AddExpression);
			assert(new AddExpression() instanceof Expression);
		},

		"should error if given args": function() {
			assert.throws(function() {
				new AddExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $add": function() {
			assert.equal(new AddExpression().getOpName(), "$add");
		}
	},

	"#evaluate()": {

		"should return the operand if null document is given": function testNullDocument() {
			/** $add with a NULL Document pointer, as called by ExpressionNary::optimize(). */
			var expr = new AddExpression();
			expr.addOperand(ConstantExpression.create(2));
			assert.strictEqual(expr.evaluate({}), 2);
		},

		"should return 0 if no operands were given": function testNoOperands() {
			/** $add without operands. */
			var expr = new AddExpression();
			assert.strictEqual(expr.evaluate({}), 0);
		},

		"should throw Error if a String operand was given": function testString() {
			/** String type unsupported. */
			var expr = new AddExpression();
			expr.addOperand(ConstantExpression.create("a"));
			assert.throws(function () {
				expr.evaluate({});
			});
		},

		"should throw Error if a Boolean operand was given": function testBool() {
			var expr = new AddExpression();
			expr.addOperand(ConstantExpression.create(true));
			assert.throws(function () {
				expr.evaluate({});
			});
		},

		"w/ 1 operand": {

			"should pass through a single int": function testInt() {
        		/** Single int argument. */
				new SingleOperandBase({
					operand: 1,
				}).run();
			},

			//SKIPPED: Long -- would be same as Int above

			"should pass through a single float": function testDouble() {
				/** Single double argument. */
				new SingleOperandBase({
					operand: 99.99,
				}).run();
			},

			"should pass through a single date": function testDate() {
				/** Single Date argument. */
				new SingleOperandBase({
					operand: new Date(12345),
				}).run();
			},

			"should pass through a single null": function testNull() {
				/** Single null argument. */
				new SingleOperandBase({
					operand: null,
				}).run();
			},

			"should pass through a single undefined": function testUndefined() {
				/** Single undefined argument. */
				new SingleOperandBase({
					operand: undefined,
					expectedResult: null,
				}).run();
			},

		},

		"w/ 2 operands": {

			"should add two ints": function testIntInt() {
				/** Add two ints. */
				new TwoOperandBase({
					operand1: 1,
					operand2: 5,
					expectedResult: 6,
				}).run();
			},

			//SKIPPED: IntIntNoOverflow

			//SKIPPED: IntLong

			//SKIPPED: IntLongOverflow

			"should add int and double": function testIntDouble() {
				/** Adding an int and a double produces a double. */
				new TwoOperandBase({
					operand1: 9,
					operand2: 1.1,
					expectedResult: 10.1,
				}).run();
			},

			"should add int and date": function testIntDate() {
				/** Adding an int and a Date produces a Date. */
				new TwoOperandBase({
					operand1: 6,
					operand2: new Date(123450),
					expectedResult: new Date(123456),
				}).run();
			},

			//SKIPPED: LongDouble

			//SKIPPED: LongDoubleNoOverflow

			"should add int and null": function testIntNull() {
				/** Adding an int and null. */
				new TwoOperandBase({
					operand1: 1,
					operand2: null,
					expectedResult: null,
				}).run();
			},

			"should add long and undefined": function testLongUndefined() {
				/** Adding a long and undefined. */
				new TwoOperandBase({
					operand1: 5e11,
					operand2: undefined,
					expectedResult: null,
				}).run();
			},

		}

	},

	"optimize": {

		"should understand a single number": function() {
			var vps = new VariablesParseState(new VariablesIdGenerator()),
				expr = Expression.parseOperand({$add:[123]}, vps).optimize();
			assert.strictEqual(expr.operands.length, 0, "should optimize operands away");
			assert(expr instanceof ConstantExpression);
			assert.strictEqual(expr.evaluate(), 123);
		},

		"should optimize strings of numbers without regard to their order": function() {
			var vps = new VariablesParseState(new VariablesIdGenerator()),
				expr = Expression.parseOperand({$add:[1,2,3,'$a',4,5,6]}, vps).optimize();
			assert.strictEqual(expr.operands.length, 2, "should optimize operands away");
			assert(expr.operands[0] instanceof FieldPathExpression);
			assert(expr.operands[1] instanceof ConstantExpression);
			assert.strictEqual(expr.operands[1].evaluate(), 1 + 2 + 3 + 4 + 5 + 6);
		},

	},

};

if (!module.parent)(new (require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
