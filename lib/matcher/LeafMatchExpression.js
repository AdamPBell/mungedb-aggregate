"use strict";

var MatchExpression = require("./MatchExpression"),
	ElementPath = require("./ElementPath");

var LeafMatchExpression = module.exports = function LeafMatchExpression(type) {
	base.call(this, type);

	this._elementPath = new ElementPath();
}, klass = LeafMatchExpression, base = MatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}}); //jshint ignore:line

proto._elementPath = undefined;
proto._path = undefined;

/**
 *
 * Checks whether the document matches against what was searched.
 *
 * @param doc
 * @param details
 * @returns {*}
 */
proto.matches = function matches(doc, details) {
	var self = this,
		checker = function(element) {
			if (!self.matchesSingleElement(element)) {
				return false;
			}

			return true;
		};

	return this._elementPath._matches(doc, details, checker);
};

/**
 *
 * Overridable method for matching against a single element.
 *
 * @param e
 * @returns {boolean}
 */
proto.matchesSingleElement = function matchesSingleElement(e) { return false; }; // The child class defines this method.

/**
 *
 * Return the internal path.
 *
 * @returns {undefined|*|klass._path}
 */
proto.path = function path() {
	return this._path;
};

/**
 *
 * Initialize the ElementPath to the input path.
 *
 * @param path
 * @returns {*}
 */
proto.initPath = function initPath(path) {
	this._path = path;

	if (this._elementPath === undefined) {
		this._elementPath = new ElementPath();
	}

	return this._elementPath.init(this._path);
};
