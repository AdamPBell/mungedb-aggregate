"use strict";
var LeafMatchExpression = require('./LeafMatchExpression');

var InMatchExpression = module.exports = function InMatchExpression(){
	base.call(this);
	this._matchType = 'MATCH_IN';
	this._arrayEntries = new ArrayFilterEntries();
}, klass = InMatchExpression, base =  LeafMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var errors = require("../../Errors.js"),
	ErrorCodes = errors.ErrorCodes,
	ArrayFilterEntries = require("./ArrayFilterEntries.js");

proto._arrayEntries = null;

/**
 *
 * Initialize the necessary items
 * @method init
 * @param path
 *
 */
proto.init = function init(path) {
	return this.initPath( path );
};

/**
 *
 * Check if the input element matches a real element
 * @method _matchesRealElement
 * @param e
 *
 */
proto._matchesRealElement = function _matchesRealElement(e) {
	if(this._arrayEntries.contains(e)) { // array wrapper.... so no e "in" array
		return true;
	}

	for (var i = 0; i < this._arrayEntries.numRegexes(); i++) {
		if ( this._arrayEntries.regex(i).matchesSingleElement( e ) )
			return true;
	}

	return false;
};

/**
 *
 * Check if the input element matches
 * @method matchesSingleElement
 * @param e
 *
 */
proto.matchesSingleElement = function matchesSingleElement(e) {
	if( this._arrayEntries === null && typeof(e) == 'object' && Object.keys(e).length === 0) {
		return true;
	}
	if (this._matchesRealElement( e )) {
		return true;
	}
	/*if (e instanceof Array){
		for (var i = 0; i < e.length; i++) {
			if(this._matchesRealElement( e[i] )) {
				return true;
			}
		}

	}*/
	return false;
};

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString(level) {
	return this._debugAddSpace( level ) + this.path() + " $in " + this._arrayEntries + (this.getTag() ? this.getTag().debugString() : '') + "\n";
};

/**
 *
 * checks if this expression is == to the other
 * @method equivalent
 * @param other
 *
 */
proto.equivalent = function equivalent(other) {
	if ( other._matchType != 'MATCH_IN' ) {
		return false;
	}
	return this.path() === other.path() && this._arrayEntries.equivalent( other._arrayEntries );
};

/**
 *
 * clone this instance to a new one
 * @method shallowClone
 *
 */
proto.shallowClone = function shallowClone(){
	var e = new InMatchExpression();
	this.copyTo( e );
	if ( this.getTag() ){
		e.setTag(this.getTag().Clone());
	}
	return e;
};

/**
 *
 * Copy our array to the input array
 * @method copyTo
 * @param toFillIn
 *
 */
proto.copyTo = function copyTo(toFillIn) {
	toFillIn.init(this.path());
	this._arrayEntries.copyTo( toFillIn._arrayEntries );
};

/**
 *
 * Return the _arrayEntries property
 * @method getArrayFilterEntries
 *
 */
proto.getArrayFilterEntries = function getArrayFilterEntries(){
	return this._arrayEntries;
};

/**
 *
 * Return the _arrayEntries property
 * @method getData
 *
 */
proto.getData = function getData(){
	return this._arrayEntries;
};
