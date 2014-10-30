"use strict";

/**
 * Create a field range expression.
 *
 * Field ranges are meant to match up with classic Matcher semantics, and therefore are conjunctions.
 *
 * For example, these appear in mongo shell predicates in one of these forms:
 *      { a : C } -> (a == C) // degenerate "point" range
 *      { a : { $lt : C } } -> (a < C) // open range
 *      { a : { $gt : C1, $lte : C2 } } -> ((a > C1) && (a <= C2)) // closed
 *
 * When initially created, a field range only includes one end of the range.  Additional points may be added via intersect().
 *
 * Note that NE and CMP are not supported.
 *
 * @class FieldRangeExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @extends mungedb-aggregate.pipeline.expressions.Expression
 * @constructor
 * @param pathExpr the field path for extracting the field value
 * @param cmpOp the comparison operator
 * @param value the value to compare against
 * @returns the newly created field range expression
 **/
var FieldRangeExpression = module.exports = function FieldRangeExpression(pathExpr, cmpOp, value){
	if (arguments.length !== 3) throw new Error("args expected: pathExpr, cmpOp, and value");
	this.pathExpr = pathExpr;
	this.range = new Range({cmpOp:cmpOp, value:value});
}, klass = FieldRangeExpression, Expression = require("./Expression"), base = Expression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	ConstantExpression = require("./ConstantExpression");

// NESTED CLASSES
var Range = (function(){
	/**
	 * create a new Range; opts is either {cmpOp:..., value:...} or {bottom:..., isBottomOpen:..., top:..., isTopOpen:...}
	 * @private
	 **/
	var klass = function Range(opts){
		this.isBottomOpen = this.isTopOpen = false;
		this.bottom = this.top = undefined;
		if(opts.hasOwnProperty("cmpOp") && opts.hasOwnProperty("value")){
			switch (opts.cmpOp) {
				case Expression.CmpOp.EQ:
					this.bottom = this.top = opts.value;
					break;

				case Expression.CmpOp.GT:
					this.isBottomOpen = true;
					/* falls through */
				case Expression.CmpOp.GTE:
					this.isTopOpen = true;
					this.bottom = opts.value;
					break;

				case Expression.CmpOp.LT:
					this.isTopOpen = true;
					/* falls through */
				case Expression.CmpOp.LTE:
					this.isBottomOpen = true;
					this.top = opts.value;
					break;

				case Expression.CmpOp.NE:
				case Expression.CmpOp.CMP:
					throw new Error("CmpOp not allowed: " + opts.cmpOp);

				default:
					throw new Error("Unexpected CmpOp: " + opts.cmpOp);
			}
		}else{
			this.bottom = opts.bottom;
			this.isBottomOpen = opts.isBottomOpen;
			this.top = opts.top;
			this.isTopOpen = opts.isTopOpen;
		}
	}, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

	// PROTOTYPE MEMBERS
	proto.intersect = function intersect(range){
		// Find the max of the bottom end of ranges
		var maxBottom = range.bottom,
			maxBottomOpen = range.isBottomOpen;
		if(this.bottom !== undefined){
			if(range.bottom === undefined){
				maxBottom = this.bottom;
				maxBottomOpen = this.isBottomOpen;
			}else{
				if(Value.compare(this.bottom, range.bottom) === 0){
					maxBottomOpen = this.isBottomOpen || range.isBottomOpen;
				}else{
					maxBottom = this.bottom;
					maxBottomOpen = this.isBottomOpen;
				}
			}
		}
		// Find the min of the tops of the ranges
		var minTop = range.top,
			minTopOpen = range.isTopOpen;
		if(this.top !== undefined){
			if(range.top === undefined){
				minTop = this.top;
				minTopOpen = this.isTopOpen;
			}else{
				if(Value.compare(this.top, range.top) === 0){
					minTopOpen = this.isTopOpen || range.isTopOpen;
				}else{
					minTop = this.top;
					minTopOpen = this.isTopOpen;
				}
			}
		}
		if(Value.compare(maxBottom, minTop) <= 0)
			return new Range({bottom:maxBottom, isBottomOpen:maxBottomOpen, top:minTop, isTopOpen:minTopOpen});
		return null; // empty intersection
	};

	proto.contains = function contains(value){
		var cmp;
		if(this.bottom !== undefined){
			cmp = Value.compare(value, this.bottom);
			if(cmp < 0) return false;
			if(this.isBottomOpen && cmp === 0) return false;
		}
		if(this.top !== undefined){
			cmp = Value.compare(value, this.top);
			if(cmp > 0) return false;
			if(this.isTopOpen && cmp === 0) return false;
		}
		return true;
	};

	return klass;
})();

// PROTOTYPE MEMBERS
proto.evaluate = function evaluate(obj){
	if(this.range === undefined) return false;
	var value = this.pathExpr.evaluate(obj);
	if(value instanceof Array)
		throw new Error('FieldRangeExpression cannot evaluate an array.');
	return this.range.contains(value);
};

proto.optimize = function optimize(){
	if(this.range === undefined) return new ConstantExpression(false);
	if(this.range.bottom === undefined && this.range.top === undefined) return new ConstantExpression(true);
	return this;
};

proto.addDependencies = function(deps){
	return this.pathExpr.addDependencies(deps);
};

/**
 * Add an intersecting range.
 *
 * This can be done any number of times after creation.  The range is
 * internally optimized for each new addition.  If the new intersection
 * extends or reduces the values within the range, the internal
 * representation is adjusted to reflect that.
 *
 * Note that NE and CMP are not supported.
 *
 * @method intersect
 * @param cmpOp the comparison operator
 * @param pValue the value to compare against
 **/
proto.intersect = function intersect(cmpOp, value){
	this.range = this.range.intersect(new Range({cmpOp:cmpOp, value:value}));
};

proto.toJSON = function toJSON(){
	if (this.range === undefined) return false; //nothing will satisfy this predicate
	if (this.range.top === undefined && this.range.bottom === undefined) return true; // any value will satisfy this predicate

	// FIXME Append constant values using the $const operator.  SERVER-6769

	var json = {};
	if (this.range.top === this.range.bottom) {
		json[Expression.CmpOp.EQ] = [this.pathExpr.toJSON(), this.range.top];
	}else{
		var leftOp = {};
		if (this.range.bottom !== undefined) {
			leftOp[this.range.isBottomOpen ? Expression.CmpOp.GT : Expression.CmpOp.GTE] = [this.pathExpr.toJSON(), this.range.bottom];
			if (this.range.top === undefined) return leftOp;
		}

		var rightOp = {};
		if(this.range.top !== undefined){
			rightOp[this.range.isTopOpen ? Expression.CmpOp.LT : Expression.CmpOp.LTE] = [this.pathExpr.toJSON(), this.range.top];
			if (this.range.bottom === undefined) return rightOp;
		}

		json.$and = [leftOp, rightOp];
	}
	return json;
};

//TODO: proto.addToBson = ...?
//TODO: proto.addToBsonObj = ...?
//TODO: proto.addToBsonArray = ...?
//TODO: proto.toMatcherBson = ...? WILL PROBABLY NEED THESE...
