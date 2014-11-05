"use strict";

var ComparisonMatchExpression = require("./ComparisonMatchExpression");

/**
 * File: matcher/expression_leaf.h
 * @class GTEMatchExpression
 * @namespace mungedb-aggregate.pipeline.matcher
 * @module mungedb-aggregate
 * @constructor
 */
var GTEMatchExpression = module.exports = function GTEMatchExpression(){
	base.call(this, "GTE");
}, klass = GTEMatchExpression, base = ComparisonMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

/**
 * @method shallowClone
 */
proto.shallowClone = function shallowClone(){
	var e = new GTEMatchExpression();
	e.init(this.path(), this._rhs);
	if(this.getTag()) {
		e.setTag(this.getTag().clone());
	}
	return e;
};
