"use strict";
var Value = require("../Value"),
	ErrorCodes = require("../../errors").ErrorCodes;

var ArrayFilterEntries = module.exports = function ArrayFilterEntries(){
	this._hasNull = false;
	this._hasEmptyArray = false;
	this._equalities = [];
	this._regexes = [];
}, klass = ArrayFilterEntries, proto = klass.prototype;


proto._equalities = undefined;

proto._hasEmptyArray = undefined;

proto._hasNull = undefined;

proto._regexes = undefined;


/**
 *
 * Push the input expression onto the _equalities array
 * @method addEquality
 * @param e
 *
 */
proto.addEquality = function addEquality(e) {
	if( e instanceof RegExp ) {
		return {code:ErrorCodes.BAD_VALUE, description:"ArrayFilterEntries equality cannot be a regex"};
	}

	if (e === undefined) {
		return {code:ErrorCodes.BAD_VALUE, description:"ArrayFilterEntries equality cannot be undefined"};
	}

	if( e === null ) {
		this._hasNull = true;
	}

	if (e instanceof Array && e.length === 0) {
		this._hasEmptyArray = true;
	}

	this._equalities.push( e );
	return {code:ErrorCodes.OK};
};

/**
 *
 * Push the input regex onto the _regexes array
 * @method addRegex
 * @param expr
 *
 */
proto.addRegex = function addRegex(expr) {
	this._regexes.push( expr );
	return {code:ErrorCodes.OK};
};

/**
 *
 * Check if the input element is contained inside of _equalities
 * @method contains
 * @param elem
 *
 */
proto.contains = function contains(elem) {
	for (var i = 0; i < this._equalities.length; i++) {
		if (typeof elem === typeof this._equalities[i]) {
			if(Value.compare(elem, this._equalities[i]) === 0) {
				return true;
			}
		}
	}
	return false;
};

/**
 *
 * Copy our internal fields to the input
 * @method copyTo
 * @param toFillIn
 *
 */
proto.copyTo = function copyTo(toFillIn) {
	// File: expression_leaf.cpp lines: 407-412
	toFillIn._hasNull = this._hasNull;
	toFillIn._hasEmptyArray = this._hasEmptyArray;
	toFillIn._equalities = this._equalities.slice(0); // Copy array

	toFillIn._regexes = this._regexes.slice(0); // Copy array
	for (var i = 0; i < this._regexes.length; i++){
		toFillIn._regexes.push(this._regexes[i].shallowClone());
	}
};

/**
 *
 * Return the _equalities property
 * @method equalities
 *
 */
proto.equalities = function equalities(){
	return this._equalities;
};

/**
 *
 * checks if this expression is == to the other
 * @method equivalent
 * @param other
 *
 */
proto.equivalent = function equivalent(other) {
	if (this._hasNull !== other._hasNull) return false;
	if (this.size() !== other.size()) return false;

	for (var i = 0; i < this._regexes.length; i++) {
		if ( !this._regexes[i].equivalent( other._regexes[i] ) ) {
			return false;
		}
	}
	return Value.compare(this._equalities, other._equalities);
};

/**
 *
 * Return the _hasEmptyArray property
 * @method hasEmptyArray
 *
 */
proto.hasEmptyArray = function hasEmptyArray(){
	return this._hasEmptyArray;
};

/**
 *
 * Return the _hasNull property
 * @method hasNull
 *
 */
proto.hasNull = function hasNull(){
	return this._hasNull;
};

/**
 *
 * Return the length of the _regexes property
 * @method numRegexes
 *
 */
proto.numRegexes = function numRegexes(){
	return this._regexes.length;
};

/**
 *
 * Return the regex at the given index
 * @method regex
 * @param idx
 *
 */
proto.regex = function regex(idx) {
	return this._regexes[idx];
};

/**
 *
 * Return whether we have a single item and it is null
 * @method singleNull
 *
 */
proto.singleNull = function singleNull(){
	return this.size() === 1 && this._hasNull;
};

/**
 *
 * Return the length of both _regexes and _equalities
 * @method size
 *
 */
proto.size = function size(){
	return this._equalities.length + this._regexes.length;
};

proto.debugString = function debugString(){
	var debug = "[ ";
	for (var i = 0; i < this._equalities.length; i++){
		debug += this._equalities[i].toString() + " ";
	}
	for (var j = 0; j < this._regexes.length; j++){
		debug += this._regexes[j].shortDebugString() + " ";
	}
	debug += "]";
	return debug;
};
