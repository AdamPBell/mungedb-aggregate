"use strict";
var LeafMatchExpression = require('./LeafMatchExpression');

// File: expression_leaf.cpp
var ExistsMatchExpression = module.exports = function ExistsMatchExpression(){
	base.call(this);
	this._matchType = 'EXISTS';
}, klass = ExistsMatchExpression, base =  LeafMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString(level) {
	return this._debugAddSpace( level ) + this.path() + " exists" + (this.getTag() ? " " + this.getTag().debugString() : "") + "\n";
};

/**
 *
 * checks if this expression is == to the other
 * @method equivalent
 * @param other
 *
 */
proto.equivalent = function equivalent(other) {
	if(this._matchType !== other._matchType) {
		return false;
	}
	return this.path() == other.path();
};

/**
 *
 * Initialize the necessary items
 * @method init
 * @param path
 * @param type
 *
 */
proto.init = function init(path) {
	return this.initPath( path );
};

/**
 *
 * Check if the input element matches
 * @method matchesSingleElement
 * @param e
 *
 */
proto.matchesSingleElement = function matchesSingleElement(e) {
	if(typeof(e) === 'undefined')
		return false;
	if(e === null)
		return true;
	if(typeof(e) === 'object')
		return (Object.keys(e).length > 0);
	else
		return true;
};

/**
 *
 * clone this instance to a new one
 * @method shallowClone
 *
 */
proto.shallowClone = function shallowClone(){
	var e = new ExistsMatchExpression();
	e.init(this.path());
	if (this.getTag())
		e.setTag(this.getTag().clone());
	return e;
};

