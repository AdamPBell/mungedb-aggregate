"use strict";

/**
 * $cond expression;  @see evaluate
 * @class CondExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var CondExpression = module.exports = function CondExpression(vars) {
		if (arguments.length !== 0) throw new Error("zero args expected");
    base.call(this);
}, klass = CondExpression,
	base = require("./FixedArityExpressionT")(klass, 3),
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});

// DEPENDENCIES
var Value = require("../Value"),
    Expression = require("./Expression"),
	FixedArityExpressionT = require("./FixedArityExpressionT");

// PROTOTYPE MEMBERS
klass.opName = "$cond";
proto.getOpName = function getOpName() {
    return klass.opName;
};

/**
 * A utility class. Not in the c++ code.  If an operand has a .value, or if it has a ._fieldPath, it is not nullish.
 * I don't have 100% confidence these are the only choices.
 * @param op				An operand that should be tested for being null-ish.
 * @returns {boolean}
 */
klass.isNullish = function isNullish(op) {
	return (op.value === null || op.value === undefined) && !op._fieldPath;
};

/**
 *
 * @param expr	- I expect this to be the RHS of $cond:{...} or $cond:[,,,]
 * @param vps
 * @returns {*}
 */
klass.parse = function parse(expr, vps) {
	// There may only be one argument - an array of 3 items, or a hash containing 3 keys.
    //this.checkArgLimit(3);

    // if not an object, return;
	// todo I don't understand why we'd do this.  shouldn't expr be {}, [], or wrong?
    if (typeof(expr) !== 'object')
		return FixedArityExpressionT.parse(expr, vps);

//NOTE: Deviation from Mongo: The c++ code has a verify( $cond ) structure. The implementation below will never work as
// $cond has been removed before we get here.
//	if(!(klass.opName in expr)) {
//		throw new Error("Invalid expression. Expected to see '"+klass.opName+"'");
//	}

    var ret = new CondExpression();

	var args = expr;

	if (args instanceof Array) {
		// it's the array form. Convert it to the object form.
		if (args.length !== 3) throw new Error("$cond requires exactly three arguments");
		for(var i=0; i<3; i++) ret.operands[i] = Expression.parseOperand(args[i], vps);
	} else {
		// This is the object form. Find the keys regardless of their order.
		Object.keys(args).forEach(function (arg) {
			if (arg === 'if') {
				ret.operands[0] = Expression.parseOperand(args.if, vps);
			}
			else if (arg === 'then') {
				ret.operands[1] = Expression.parseOperand(args.then, vps);
			}
			else if (arg === 'else') {
				ret.operands[2] = Expression.parseOperand(args.else, vps);
			}
			else {
				throw new Error("Unrecognized parameter to $cond: '" + arg + "'; code 17083");
			}
		});
	}

	// The Operands array should have been loaded.  Make sure they are all reasonable.
	// TODO I think isNullish is brittle.
    if (klass.isNullish(ret.operands[0])) throw new Error("Missing 'if' parameter to $cond; code 17080");
    if (klass.isNullish(ret.operands[1])) throw new Error("Missing 'then' parameter to $cond; code 17081");
    if (klass.isNullish(ret.operands[2])) throw new Error("Missing 'else' parameter to $cond; code 17082");

    return ret;
};

/**
 * Use the $cond operator with the following syntax:
 * { $cond: { if: <boolean-expression>, then: <true-case>, else: <false-case-> } }
 * -or-
 * { $cond: [ <boolean-expression>, <true-case>, <false-case> ] }
 * @method evaluate
 **/
proto.evaluateInternal = function evaluateInternal(vars) {
		var pCond1 = this.operands[0].evaluateInternal(vars);

		this.idx = 0;
		if (Value.coerceToBool(pCond1)) {
			this.idx = 1;
		} else {
			this.idx = 2;
		}

		return this.operands[this.idx].evaluateInternal(vars);
};

/** Register Expression */
Expression.registerExpression(klass.opName, klass.parse);
