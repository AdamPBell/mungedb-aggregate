"use strict";

var ComparisonMatchExpression = require("./ComparisonMatchExpression");

/**
 * File: matcher/expression_leaf.h
 * @class LTEMatchExpression
 * @namespace mungedb-aggregate.matcher
 * @module mungedb-aggregate
 * @constructor
 */
var LTEMatchExpression = module.exports = function LTEMatchExpression(){
	base.call(this, "LTE");
}, klass = LTEMatchExpression, base = ComparisonMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

/**
 * @method shallowClone
 */
proto.shallowClone = function shallowClone(){
	var e = new LTEMatchExpression();
	e.init(this.path(), this._rhs);
	if(this.getTag()) {
		e.setTag(this.getTag().clone());
	}
	return e;
};
