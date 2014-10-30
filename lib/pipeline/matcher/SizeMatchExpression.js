"use strict";
var ArrayMatchingMatchExpression = require('./ArrayMatchingMatchExpression');

var SizeMatchExpression = module.exports = function SizeMatchExpression(){
	base.call(this, 'SIZE');
}, klass = SizeMatchExpression, base =  ArrayMatchingMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

proto._size = undefined;

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString(level) {
	var debug = this._debugAddSpace( level ) + this.path() + " $size : " + this._size.toString() + "\n";
	
	var td = this.tagData();
	if (td !== null){
		debug += " " + td.debugString();
	}
	return debug;
};

/**
 *
 * checks if this expression is == to the other
 * @method equivalent
 * @param other
 *
 */
proto.equivalent = function equivalent(other) {
	if(other.matchType() !== this.matchType()) {
		return false;
	}
	return this._size === other._size && this.path() === other.path();
};

/**
 *
 * Return the _size property
 * @method getData
 *
 */
proto.getData = function getData(){
	return this._size;
};

/**
 *
 * Initialize the necessary items
 * @method init
 * @param path
 * @param size
 *
 */
proto.init = function init(path,size) {
	this._size = size;
	return this.initPath(path);
};

/**
 *
 * Check if the input array matches
 * @method matchesArray
 * @param anArray
 * @param details
 *
 */
proto.matchesArray = function matchesArray(anArray, details) {
	if(this._size < 0) {
		return false;
	}
	return anArray.length === this._size;
};

/**
 *
 * clone this instance to a new one
 * @method shallowClone
 *
 */
proto.shallowClone = function shallowClone(){
	// File: expression_array.h lines: 116-119
	var e = new SizeMatchExpression();
	e.init(this.path(),this._size);
	if ( this.getTag() ) {
		e.setTag(this.getTag().clone());
	}
	return e;
};
