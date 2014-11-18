"use strict";

var EqualityMatchExpression = module.exports = function EqualityMatchExpression(){
	base.call(this,"EQ");
}, klass = EqualityMatchExpression, base = require("./ComparisonMatchExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

/**
 *
 * Return a new instance of this class, with fields set the same as ourself
 * @method shallowClone
 * @param
 *
 */
proto.shallowClone = function shallowClone( /*  */ ){
	var e = new EqualityMatchExpression();
	e.init ( this.path(), this._rhs );

	if ( this.getTag() ) {
		e.setTag(this.getTag().clone());
	}
	return e;
};
