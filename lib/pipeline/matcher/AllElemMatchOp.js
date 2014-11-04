"use strict";

var MatchExpression = require('./MatchExpression');

// From expression_array.h
var AllElemMatchOp = module.exports = function AllElemMatchOp(){
	base.call(this);
	this._matchType = 'ALL';
	this._elementPath = new ElementPath();
	this._list = [];
}, klass = AllElemMatchOp, base =  MatchExpression , proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var errors = require("../../Errors.js"),
	ErrorCodes = errors.ErrorCodes,
	ElementPath = require('./ElementPath.js');

// ElementPath _elementPath
proto._elementPath = undefined;
// std::vector< MatchExpression* > _list;
proto._list = undefined;
// StringData _path;
proto._path = undefined;

/**
 *
 * This method checks the input array and determines if each item inside matches
 * @method _allMatch
 * @param anArray
 *
 */
proto._allMatch = function _allMatch(anArray) {
	if (this._list.length === 0) return false;

	for (var i = 0; i < this._list.length; i++) {
		if (!this._list[i].matchesArray(anArray, null)) return false;
	}

	return true;
};

/**
 *
 * This method adds a new expression to the internal array of expression
 * @method add
 * @param expr
 *
 */
proto.add = function add(expr) {
	if (!expr) throw new Error("AllElemMatchOp:add#68 failed to verify expr");
	this._list.push(expr);
};

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString(level) {
	console.debug(this._debugAddSpace(level) + this._path + " AllElemMatchOp: " + this._path + '\n');
	for (var i = 0; i < this._list.length; i++) {
		this._list[i].debugString(level +1);
	}
};

/**
 *
 * checks if this expression is == to the other
 * @method equivalent
 * @param other
 *
 */
proto.equivalent = function equivalent(other) {
	if (this.matchType() != other.matchType()) {
		return false;
	}

	if (this._path != other._path) {
		return false;
	}

	if (this._list.length != other._list.length) {
		return false;
	}

	for (var i = 0; i < this._list.length; i++) {
		if (!this._list[i].equivalent(other._list[i])) {
			return false;
		}
	}
	return true;
};

/**
 *
 * gets the specified item from the list
 * @method getChild
 * @param i
 *
 */
proto.getChild = function getChild(i) {
	return this._list[i];
};

/**
 *
 * Initialize the necessary items
 * @method init
 * @param path
 *
 */
proto.init = function init(path) {
	this._path = path;
	var s = this._elementPath.init(this._path);
	this._elementPath.setTraverseLeafArray(false);
	return s;
};

/**
 *
 * matches checks the input doc against the internal path to see if it is a match
 * @method matches
 * @param doc
 * @param details
 *
 */
proto.matches = function matches(doc, details) {
	var self = this,
		checker = function(element) {
			if (!(element instanceof Array)) {
				return false;
			}

			//var amIRoot = (element.length === 0);

			if (self._allMatch(element)) {
				return true;
			}

			/*
			if (!amIRoot && details && details.needRecord() {
				details.setElemMatchKey(element);
			}
			*/
			return false;
		};
	return this._elementPath._matches(doc, details, checker);
};

/**
 *
 * Check if the input element matches
 * @method matchesSingleElement
 * @param e
 *
 */
proto.matchesSingleElement = function matchesSingleElement(e) {
	if (!(e instanceof Array)) {
		return false;
	}
	return this._allMatch(e);
};

/**
 *
 * return the length of the internal array
 * @method numChildren
 * @param
 *
 */
proto.numChildren = function numChildren() {
	return this._list.length;
};


/**
 *
 * return the internal path
 * @method path
 * @param
 *
 */
proto.path = function path() {
	return this._path;
};


/**
 *
 * clone this instance to a new one
 * @method shallowClone
 * @param
 *
 */
proto.shallowClone = function shallowClone() {
	var e = new AllElemMatchOp();
	e.init(this._path);
	e._list = this._list.slice(0);
	return e;
};
