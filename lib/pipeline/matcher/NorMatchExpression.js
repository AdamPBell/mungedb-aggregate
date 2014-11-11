"use strict";
var ListOfMatchExpression = require("./ListOfMatchExpression");

var NorMatchExpression = module.exports = function NorMatchExpression(){
	base.call(this);
	this._matchType = "NOR";
}, klass = NorMatchExpression, base = ListOfMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString(level) {
	return this._debugAddSpace(level) +
		"$nor\n" +
		this._debugList(level);
};

/**
 *
 * matches checks the input doc against the internal element path to see if it is a match
 * @method matches
 * @param doc
 * @param details
 *
 */
proto.matches = function matches(doc,detail) {
	for (var i = 0; i < this.numChildren(); i++) {
		if( this.getChild(i).matches( doc, null )) {
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
proto.matchesSingleElement = function matchesSingleElement(e) {
	for (var i = 0; i < this.numChildren(); i++) {
		if( this.getChild(i).matchesSingleElement( e )) {
			return false;
		}
	}
	return true;
};

/**
 *
 * clone this instance to a new one
 * @method shallowClone
 *
 */
proto.shallowClone = function shallowClone(){
	//         virtual MatchExpression* shallowClone() const {
	//             NorMatchExpression* self = new NorMatchExpression();
	//             for (size_t i = 0; i < numChildren(); ++i) {
	//                 self->add(getChild(i)->shallowClone());
	//             }
	//             return self;
	//         }
	var e = new NorMatchExpression();
	for (var i = 0; i < this.numChildren(); i++) {
		e.add(this.getChild(i).shallowClone());
	}

	if (this.getTag()) {
		e.setTag(this.getTag().clone());
	}

	return e;
};
