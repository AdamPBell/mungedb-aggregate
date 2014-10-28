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
	base = require("./FixedArityExpression")(klass, 3),
	proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});

// DEPENDENCIES
var Value = require("../Value"),
    Expression = require("./Expression");

// PROTOTYPE MEMBERS
klass.opName = "$cond";
proto.getOpName = function getOpName() {
    return klass.opName;
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
    if (typeof(expr) !== Object)
		return Expression.parse(expr, vps);

	// ...or expr could be the entirety of $cond:{...} or $cond:[,,,].
	if(!(klass.opName in expr)) {
		throw new Error("Invalid expression. Expected to see '"+klass.opName+"'");
	}

    var ret = new CondExpression();

	// If this is an Object and not an array, verify all the bits are specified.
	// If this is an Object that is an array, verify there are three bits.
	// (My issue here is that we got to this parse function when we parsed the $cond:{...} item, and we're calling
	// parseOperand (again) without altering the input.)
//    var args = Expression.parseOperand(expr, vps);

	var args = expr[getOpName()];

	if (typeof args !== 'object') throw new Error("this should not happen");
	if (args instanceof Array) {
		// it's the array form. Convert it to the object form.
		if (args.length !== 3) throw new Error("$cond requires exactly three arguments");
		args = {if: args[0], then: args[1], else: args[2]};
	}

	// One way or the other, args is now in object form.
	Object.keys(args).forEach(function(arg) {
		if (arg === 'if') {
			ret.operands[0] = Expression.parseOperand(args['if'], vps);
		}
		else if (arg === 'then') {
			ret.operands[1] = Expression.parseOperand(args['then'], vps);
		}
		else if (arg === 'else') {
			ret.operands[2] = Expression.parseOperand(args['else'], vps);
		}
		else {
			throw new Error("Unrecognized parameter to $cond: '" + arg + "'; code 17083");
		}
	});

    if (!ret.operands[0]) throw new Error("Missing 'if' parameter to $cond; code 17080");
    if (!ret.operands[1]) throw new Error("Missing 'then' parameter to $cond; code 17081");
    if (!ret.operands[2]) throw new Error("Missing 'else' parameter to $cond; code 17082");

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
		if (pCond1.coerceToBool()) {
			this.idx = 1;
		} else {
			this.idx = 2;
		}

		return this.operands[this.idx].evaluateInternal(vars);
};

/** Register Expression */
Expression.registerExpression(klass.opName, klass.parse);
