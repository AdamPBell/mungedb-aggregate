"use strict";
var MatchExpression = require('./MatchExpression');
var NotMatchExpression = module.exports = function NotMatchExpression(){
	base.call(this);
	this._matchType = 'NOT';
}, klass = NotMatchExpression, base =  Object  , proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

proto._exp = undefined;

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString(level) {
	return this._debugAddSpace( level ) + "$not\n" + this._exp._debugString( level + 1 );
};

/**
 *
 * checks if this expression is == to the other
 * @method equivalent
 * @param other
 *
 */
proto.equivalent = function equivalent(other) {
	return other._matchType == 'NOT' && this._exp.equivalent(other.getChild(0));
};

/**
 *
 * Return the _exp property
 * @method getChild
 * @param i
 *
 */
proto.getChild = function getChild(i) {
	return this._exp.get();
};

/**
 *
 * Return the released child
 * @method releaseChild
 *
 */
proto.releaseChild = function releaseChild() {
	return this._exp.release();
};

/**
 *
 * Return the reset child
 * @method resetChild
 *
 */
proto.resetChild = function resetChild(newChild) {
	this._exp.reset(newChild);
};

/**
 *
 * Initialize the necessary items
 * @method init
 * @param exp
 *
 */
proto.init = function init(exp) {
	this._exp = exp;
	return {'code':'OK'};
};

/**
 *
 * matches checks the input doc against the internal element path to see if it is a match
 * @method matches
 * @param doc
 * @param details
 *
 */
proto.matches = function matches(doc, details) {
	return ! this._exp.matches(doc, null);
};

/**
 *
 * Check if the input element matches
 * @method matchesSingleElement
 * @param e
 *
 */
proto.matchesSingleElement = function matchesSingleElement(e) {
	return ! this._exp.matchesSingleElement( e );
};

/**
 *
 * Return the number of children contained by this expression
 * @method numChildren
 * @param
 *
 */
proto.numChildren = function numChildren(){
	return 1;
};

/**
 *
 * clone this instance to a new one
 * @method shallowClone
 *
 */
proto.shallowClone = function shallowClone(){
	// File: expression_tree.h lines: 128-132
	var e = new NotMatchExpression();
	e.init(this._exp.shallowClone());
	if ( this.getTag() ) {
		e.setTag(this.getTag().clone());
	}
	return e;
};

