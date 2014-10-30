"use strict";
var LeafMatchExpression = require('./LeafMatchExpression'),
	ErrorCodes = require("../../Errors.js").ErrorCodes;

// File: expression_leaf.h
var ModMatchExpression = module.exports = function ModMatchExpression(){
	base.call(this);
	this._matchType = 'MOD';
}, klass = ModMatchExpression, base =  LeafMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});


proto._divisor = undefined;

proto._remainder = undefined;

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString(level) {
	return this._debugAddSpace( level ) + this.path() + " mod " + this._divisor + " % x == " + this._remainder + (this.getTag() ? " " + this.getTag().debugString() : '') + "\n";
};

/**
 *
 * checks if this expression is == to the other
 * @method equivalent
 * @param other
 *
 */
proto.equivalent = function equivalent(other) {
	if(other._matchType !== this._matchType)
		return false;
	return this.path() === other.path() && this._divisor === other._divisor && this._remainder === other._remainder;
};

/**
 *
 * Return the _divisor property
 * @method getDivisor
 *
 */
proto.getDivisor = function getDivisor(){
	return this._divisor;
};

/**
 *
 * Return the _remainder property
 * @method getRemainder
 *
 */
proto.getRemainder = function getRemainder( /*  */ ){
	return this._remainder;
};

/**
 *
 * Initialize the necessary items
 * @method init
 * @param path
 * @param type
 *
 */
proto.init = function init(path,divisor,remainder) {
	if (divisor === 0 ){
		debugger;
		return {'code':ErrorCodes.BAD_VALUE, 'desc':'Divisor cannot be 0'};
	}

	this._divisor = divisor;
	this._remainder = remainder;
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
	if(typeof(e) !== 'number') {
		return false;
	}

	return (e % this._divisor) === this._remainder;
};

/**
 *
 * clone this instance to a new one
 * @method shallowClone
 *
 */
proto.shallowClone = function shallowClone(){
	var e = new ModMatchExpression();
	e.init(this.path(),this._divisor, this._remainder);
	if (this.getTag())
		e.setTag(this.getTag().clone());
	return e;
};


