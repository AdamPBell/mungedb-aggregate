"use strict";

/**
 * Generic comparison expression that gets used for $eq, $ne, $lt, $lte, $gt, $gte, and $cmp.
 * @class CompareExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var CompareExpression = module.exports = function CompareExpression(cmpOp) {
	if (!(arguments.length === 1 && typeof cmpOp === "string")) throw new Error(klass.name + ": args expected: cmpOp");
    this.cmpOp = cmpOp;
    base.call(this);
}, klass = CompareExpression, base = require("./FixedArityExpressionT")(CompareExpression, 2), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});


var Value = require("../Value"),
	Expression = require("./Expression");


klass.parse = function parse(jsonExpr, vps, op) {
	var expr = new CompareExpression(op),
		args = base.parseArguments(jsonExpr, vps);
	expr.validateArguments(args);
	expr.operands = args;
	return expr;
};


/**
 * Lookup table for truth value returns
 * @param truthValues   truth value for -1, 0, 1
 * @param reverse               reverse comparison operator
 * @param name                  string name
 */
var CmpLookup = function CmpLookup(truthValues, reverse, name) { // emulating a struct
	if (arguments.length !== 3) throw new Error("args expected: truthValues, reverse, name");
	this.truthValues = truthValues;
	this.reverse = reverse;
	this.name = name;
};


/**
 * Enumeration of comparison operators. Any changes to these values require adjustment of
 * the lookup table in the implementation.
 */
var CmpOp = klass.CmpOp = {
	EQ: "$eq",
	NE: "$ne",
	GT: "$gt",
	GTE: "$gte",
	LT: "$lt",
	LTE: "$lte",
	CMP: "$cmp",
};


/**
 * a table of cmp type lookups to truth values
 * @private
 */
var cmpLookupMap = [ //NOTE: converted from this Array to a Dict/Object below using CmpLookup#name as the key
	//              -1      0      1      reverse             name     (taking advantage of the fact that our 'enums' are strings below)
	new CmpLookup([false, true, false], CmpOp.EQ, CmpOp.EQ),
	new CmpLookup([true, false, true], CmpOp.NE, CmpOp.NE),
	new CmpLookup([false, false, true], CmpOp.LT, CmpOp.GT),
	new CmpLookup([false, true, true], CmpOp.LTE, CmpOp.GTE),
	new CmpLookup([true, false, false], CmpOp.GT, CmpOp.LT),
	new CmpLookup([true, true, false], CmpOp.GTE, CmpOp.LTE),

	// CMP is special. Only name is used.
	new CmpLookup([false, false, false], CmpOp.CMP, CmpOp.CMP)
].reduce(function(r, o) {
	r[o.name] = o;
	return r;
}, {});


proto.evaluateInternal = function evaluateInternal(vars) {
	var left = this.operands[0].evaluateInternal(vars),
		right = this.operands[1].evaluateInternal(vars),
		cmp = Value.compare(left, right);

    // Make cmp one of 1, 0, or -1.
	if (cmp === 0) {
		//leave as 0
	} else if (cmp < 0) {
		cmp = -1;
	} else if (cmp > 0) {
		cmp = 1;
	}

	if (this.cmpOp === CmpOp.CMP)
		return cmp;

	var returnValue = cmpLookupMap[this.cmpOp].truthValues[cmp + 1];
	return returnValue;
};


proto.getOpName = function getOpName() {
	return this.cmpOp;
};


function bindLast(fn, lastArg) { // similar to the boost::bind used in the mongo code
	return function() {
		return fn.apply(this, Array.prototype.slice.call(arguments).concat([lastArg]));
	};
}
Expression.registerExpression("$cmp", bindLast(klass.parse, CmpOp.CMP));
Expression.registerExpression("$eq", bindLast(klass.parse, CmpOp.EQ));
Expression.registerExpression("$gt", bindLast(klass.parse, CmpOp.GT));
Expression.registerExpression("$gte", bindLast(klass.parse, CmpOp.GTE));
Expression.registerExpression("$lt", bindLast(klass.parse, CmpOp.LT));
Expression.registerExpression("$lte", bindLast(klass.parse, CmpOp.LTE));
Expression.registerExpression("$ne", bindLast(klass.parse, CmpOp.NE));
