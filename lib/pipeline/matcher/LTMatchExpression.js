"use strict";

var ComparisonMatchExpression = require("./ComparisonMatchExpression");

/**
 * File: matcher/expression_leaf.h
 * @class LTMatchExpression
 * @namespace mungedb-aggregate.pipeline.matcher
 * @module mungedb-aggregate
 * @constructor
 */
var LTMatchExpression = module.exports = function LTMatchExpression(){
	base.call(this, "LT");
}, klass = LTMatchExpression, base = ComparisonMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

/**
 * @method shallowClone
 */
proto.shallowClone = function shallowClone(){
	var e = new LTMatchExpression();
	e.init(this.path(), this._rhs);
	if(this.getTag()) {
		e.setTag(this.getTag().clone());
	}
	return e;
};
