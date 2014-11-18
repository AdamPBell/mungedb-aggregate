"use strict";

/**
 * @class GTMatchExpression
 * @namespace mungedb-aggregate.matcher
 * @module mungedb-aggregate
 * @constructor
 */
var GTMatchExpression = module.exports = function GTMatchExpression(){
	base.call(this, "GT");
}, klass = GTMatchExpression, base = require("./ComparisonMatchExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

/**
 * @method shallowClone
 */
proto.shallowClone = function shallowClone(){
	var e = new GTMatchExpression();
	e.init(this.path(), this._rhs);
	if(this.getTag()) {
		e.setTag(this.getTag().clone());
	}
	return e;
};
