"use strict";

var MatchExpression = require("./MatchExpression"),
	ElementPath = require("./ElementPath");

var TypeMatchExpression = module.exports = function TypeMatchExpression() {
	base.call(this, "TYPE_OPERATOR");

	this._elementPath = new ElementPath();
}, klass = TypeMatchExpression, base = MatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}}); //jshint ignore:line

proto._elementPath = undefined;
proto._path = undefined;
proto._type = undefined;

/**
 * Initialize the current object.
 *
 * @param path
 * @param type
 * @returns {*}
 */
proto.init = function init(path, type) {
	this._path = path;
	this._type = type;

	return this._elementPath.init(path);
};

/**
 *
 * Returns a shallow copy of the instance.
 *
 * @returns {TypeMatchExpression}
 */
proto.shallowClone = function shallowClone(){
	var clone = new TypeMatchExpression();

	clone.init(this._path, this._type);

	if (this.getTag()) {
		clone.setTag(this.getTag().clone());
	}

	return clone;
};

/**
 * Used number reference to types like the C++ enum (?).
 *
 * @param e
 * @returns {number}
 */
klass.type = function type(e) {
	if(e === undefined) {
		return 6;
	} else if (e === null) {
		return 10;
	}

	switch (typeof e) {
		case "number":
			return 1;
		case "string":
			return 2;
		case "boolean":
			return 8;
		case "object":
			if (e instanceof Array) {
				return 4;
			} else if (e instanceof RegExp) {
				return 11;
			} else if (e instanceof Date) {
				return 9;
			} else if (e.constructor.name === "MinKey") {
				return -1;
			} else if (e.constructor.name === "MaxKey") {
				return 127;
			}
	}

	return 42;
};

/**
 * Matches single element.
 *
 * @param e
 * @returns {boolean}
 */
proto.matchesSingleElement = function matchesSingleElement(e) {
	return klass.type(e) === this._type;
};

/**
 * Matches against the document.
 *
 * @param doc
 * @param details
 * @returns {*}
 */
proto.matches = function matches(doc, details) {
	var self = this,
		matcher = function matcher(element) {
			if (!self.matchesSingleElement(element, details)) {
				return false;
			}

			return true;
		};

	return this._elementPath._matches(doc, details, matcher);
};

/**
 * Writes a debug string for this object.
 *
 * @param level
 * @returns {string}
 */
proto.debugString = function debugString(level) {
	var rtn  = this._debugAddSpace(level) + this.path() + " type: " + this._type;

	if (this.getTag()) {
		rtn += " " + this.getTag().debugString();
	}

	return rtn + "\n";
};

/**
 * Checks to see if the other instance is equivalent to the current instance.
 *
 * @param other
 * @returns {boolean}
 */
proto.equivalent = function equivalent(other) {
	if (this.matchType() !== other.matchType()) {
		return false;
	}

	return (this._path === other._path && this._type === other._type);
};

/**
 * Return the type we're matching against.
 *
 * @returns {undefined|*}
 */
proto.getData = function getData() {
	return this._type;
};

/**
 * Return the path associated with the current object.
 *
 * @returns {undefined|*|klass._path}
 */
proto.path = function path() {
	return this._path;
};
