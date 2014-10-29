"use strict";

/**
 * Generic comparison expression that gets used for $eq, $ne, $lt, $lte, $gt, $gte, and $cmp.
 * @class CompareExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var CompareExpression = module.exports = function CompareExpression(cmpOp) {
    this.cmpOp = cmpOp;
    base.call(this);
}, klass = CompareExpression,
    FixedArityExpression = require("./FixedArityExpressionT")(klass, 2),
	base = FixedArityExpression,
    proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
	});

// DEPENDENCIES
var Value = require("../Value");
var Expression = require("./Expression");
var ConstantExpression = require("./ConstantExpression");
var FieldPathExpression = require("./FieldPathExpression");
var FieldRangeExpression = require("./FieldRangeExpression");
var NaryExpression = require("./NaryExpression");

// NESTED CLASSES
/**
 * Lookup table for truth value returns
 *
 * @param truthValues   truth value for -1, 0, 1
 * @param reverse               reverse comparison operator
 * @param name                  string name
 **/
var CmpLookup = (function() { // emulating a struct
	// CONSTRUCTOR
	var klass = function CmpLookup(truthValues, reverse, name) {
		if (arguments.length !== 3) throw new Error("args expected: truthValues, reverse, name");
		this.truthValues = truthValues;
		this.reverse = reverse;
		this.name = name;
	}, base = Object,
		proto = klass.prototype = Object.create(base.prototype, {
			constructor: {
				value: klass
			}
		});
	return klass;
})();

// verify we need this below
// PRIVATE STATIC MEMBERS
/**
 * a table of cmp type lookups to truth values
 * @private
 **/
var cmpLookupMap = [ //NOTE: converted from this Array to a Dict/Object below using CmpLookup#name as the key
	//              -1      0      1      reverse             name     (taking advantage of the fact that our 'enums' are strings below)
	new CmpLookup([false, true, false], CompareExpression.EQ, CompareExpression.EQ),
	new CmpLookup([true, false, true], CompareExpression.NE, CompareExpression.NE),
	new CmpLookup([false, false, true], CompareExpression.LT, CompareExpression.GT),
	new CmpLookup([false, true, true], CompareExpression.LTE, CompareExpression.GTE),
	new CmpLookup([true, false, false], CompareExpression.GT, CompareExpression.LT),
	new CmpLookup([true, true, false], CompareExpression.GTE, CompareExpression.LTE),

	// CMP is special. Only name is used.
	new CmpLookup([false, false, false], CompareExpression.CMP, CompareExpression.CMP)
].reduce(function(r, o) {
	r[o.name] = o;
	return r;
}, {});


//NOTE: DEVIATION FROM MONGO: moving op to the first argument slot so we can bind it
klass.parse = function parse(op, jsonExpr, vps) {
	var expr = new CompareExpression(op),
		args = base.parseArguments(jsonExpr, vps);
	expr.validateArguments(args);
	expr.operands = args;
	return expr;
};

// PROTOTYPE MEMBERS
proto.evaluateInternal = function evaluateInternal(vars) {
	var left = this.operands[0].evaluateInternal(vars),
		right = this.operands[1].evaluateInternal(vars),
		cmp = Value.compare(left, right);

	if(cmp == 0) {
		//leave as 0
	} else if(cmp < 0) {
		cmp = -1;
	} else if(cmp > 0) {
		cmp = 1;
	}

	if (this.cmpOp === klass.CMP) return cmp;
	return cmpLookupMap[this.cmpOp].truthValues[cmp + 1];
};

klass.EQ = "$eq";
klass.NE = "$ne";
klass.GT = "$gt";
klass.GTE = "$gte";
klass.LT = "$lt";
klass.LTE = "$lte";
klass.CMP = "$cmp";

proto.getOpName = function getOpName() {
	return this.cmpOp;
};

/** Register Expression */
Expression.registerExpression("$eq", klass.parse.bind(klass, klass.EQ));
Expression.registerExpression("$ne", klass.parse.bind(klass, klass.NE));
Expression.registerExpression("$gt", klass.parse.bind(klass, klass.GT));
Expression.registerExpression("$gte", klass.parse.bind(klass, klass.GTE));
Expression.registerExpression("$lt", klass.parse.bind(klass, klass.LT));
Expression.registerExpression("$lte", klass.parse.bind(klass, klass.LTE));
Expression.registerExpression("$cmp", klass.parse.bind(klass, klass.CMP));
