"use strict";
var LeafMatchExpression = require("./LeafMatchExpression");

var TextMatchExpression = module.exports = function TextMatchExpression() {
	base.call(this, "TEXT");
}, klass = TextMatchExpression, base = LeafMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}}); //jshint ignore:line

/**
 *
 * Initializes the class object.
 *
 * @param query
 * @param language
 * @returns {*}
 */
proto.init = function init(query, language) {
	this._query = query;
	this._language = language;

	return this.initPath("_fts");
};

/**
 * Gets the query.
 *
 * @returns {*}
 */
proto.getQuery = function getQuery() {
	return this._query;
};

/**
 * Gets the language.
 *
 * @returns {*}
 */
proto.getLanguage = function getLanguage() {
	return this._language;
};

/**
 * Check if the input element matches.
 *
 * @param e
 * @returns {boolean}
 */
proto.matchesSingleElement = function matchesSingleElement(e) {
	return true;
};

/**
 * Debug a string.
 *
 * @param level
 * @returns {string}
 */
proto.debugString = function debugString(level) {
	var rtn = this._debugAddSpace(level);

	rtn += "TEXT : query=" + ", language=" + this._language + ", tag=";

	var tagData = this.getTag();

	if (tagData !== null) {
		tagData.debugString(level);
	} else {
		rtn += "NULL";
	}

	return rtn + "\n";
};

/**
 * Verifies the equivalency of two operands.
 *
 * @param other
 * @returns {boolean}
 */
proto.equivalent = function equivalent(other) {
	if (this.matchType() !== other.matchType()) {
		return false;
	}

	if (other.getQuery() !== this._query) {
		return false;
	}

	if (other.getLanguage() !== this._language) {
		return false;
	}

	return true;
};

/**
 * Clone this instance into a new one.
 *
 * @returns {TextMatchExpression}
 */
proto.shallowClone = function shallowClone() {
	var next = new TextMatchExpression();

	next.init(this._query, this._language);

	if (this.getTag()) {
		next.getTag(this.getTag().clone());
	}

	return next;
};
