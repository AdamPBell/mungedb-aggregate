"use strict";
var ArrayMatchingMatchExpression = require('./ArrayMatchingMatchExpression.js');

// Autogenerated by cport.py on 2013-09-17 14:37
var ElemMatchValueMatchExpression = module.exports = function ElemMatchValueMatchExpression(){
	base.call(this);
	this._matchType = 'ELEM_MATCH_VALUE';
	this._subs = [];
}, klass = ElemMatchValueMatchExpression, base =  ArrayMatchingMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var errors = require("../../Errors.js"),
	ErrorCodes = errors.ErrorCodes;

// File: expression_array.h lines: 108-108
proto._subs = undefined;

/**
 *
 * Check if the input element matches all items in the array
 * @method _arrayElementMatchesAll
 * @param element
 *
 */
proto._arrayElementMatchesAll = function _arrayElementMatchesAll(element){
	// File: expression_array.cpp lines: 152-157
	for (var i = 0; i < this._subs.length; i++ ) {
		if (!this._subs[i].matchesSingleElement(element))
			return false;
	}
	return true;
};

/**
 *
 * push an item onto the internal array
 * @method add
 * @param sub
 *
 */
proto.add = function add(sub){
	// File: expression_array.cpp lines: 132-134
	if (!sub) throw new Error(sub + " ElemMatchValueMatchExpression:36");
	this._subs.push(sub);
};

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString(level){
	// File: expression_array.cpp lines: 160-165
	var debug = this._debugAddSpace(level);
	debug = debug + this.path() + " $elemMatch\n";
	for (var i = 0; i < this._subs.length; i++) {
		debug = debug + this._subs[i].debugString(level + 1);
	}
	return debug;
};

/**
 *
 * Get the given child in the internal array
 * @method getChild
 * @param i
 *
 */
proto.getChild = function getChild(i){
	// File: expression_array.h lines: 103-102
	return this._subs[i];
};

/**
 *
 * Initialize the necessary items
 * @method init
 * @param path
 * @param sub
 *
 */
proto.init = function init(path, sub){
	// File: expression_array.cpp lines: 121-124
	this.initPath(path);
	if (sub)
		this.add(sub);
	return {code:ErrorCodes.OK};
};

/**
 *
 * Check if one of the items in the input array matches everything in the internal array
 * @method matchesArray
 * @param anArray
 * @param details
 *
 */
proto.matchesArray = function matchesArray(anArray, details){
	// File: expression_array.cpp lines: 137-149
	for (var i in anArray) {
		var inner = anArray[i];

		if (this._arrayElementMatchesAll(inner)) {
			if (details && details.needRecord()) {
				details.setElemMatchKey(i);
			}
			return true;
		}
	}
	return false;
};

/**
 *
 * Return the number of items in the internal array
 * @method numChildren
 *
 */
proto.numChildren = function numChildren(){
	// File: expression_array.h lines: 102-101
	return this._subs.length;
};

/**
 *
 * clone this instance to a new one
 * @method shallowClone
 *
 */
proto.shallowClone = function shallowClone(){
	// File: expression_array.h lines: 91-97
	var element = new ElemMatchValueMatchExpression();
	element.init(this.path());
	for (var i = 0; i < this._subs.length; ++i) {
		element.add(this._subs[i].shallowClone());
	}
	return element;
};