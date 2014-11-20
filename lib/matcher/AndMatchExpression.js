"use strict";

var AndMatchExpression = module.exports = function AndMatchExpression(){
	base.call(this);
	this._expressions = [];
	this._matchType = "AND";
}, klass = AndMatchExpression, base = require("./ListOfMatchExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString( level ) { //  StringBuilder& debug, int level
// File: expression_tree.cpp lines: 85-88
	return this._debugAddSpace(level) + "$and\n" + this._debugList(level);
};

/**
 *
 * matches checks the input doc against the internal path to see if it is a match
 * @method matches
 * @param doc
 * @param details
 *
 */
proto.matches = function matches(doc, details) { //  const MatchableDocument* doc, MatchDetails* details
	// File: expression_tree.cpp lines: 64-72
	var tChild;
	for (var i = 0; i < this.numChildren(); i++) {
		tChild = this.getChild(i);
		if (!tChild.matches(doc, details)) {
			if (details) {
				details.resetOutput();
			}
			return false;
		}
	}
	return true;
};


/**
 *
 * Check if the input element matches
 * @method matchesSingleElement
 * @param e
 *
 */
proto.matchesSingleElement = function matchesSingleElement( e ){ //  const BSONElement& e
	// File: expression_tree.cpp lines: 75-81
	for (var i = 0; i < this.numChildren(); i++) {
		if (!this.getChild(i).matchesSingleElement(e)) {
			return false;
		}
	}
	return true;
};


/**
 *
 * clone this instance to a new one
 * @method shallowClone
 * @param
 *
 */
proto.shallowClone = function shallowClone( /*  */ ){
// File: expression_tree.h lines: 67-72
	var e = new AndMatchExpression();
	for (var i = 0; i < this.numChildren(); i++) {
		e.add(this.getChild(i).shallowClone());
	}

	if (this.getTag()) {
		e.setTag(this.getTag().clone());
	}

	return e; // Return the shallow copy.
};