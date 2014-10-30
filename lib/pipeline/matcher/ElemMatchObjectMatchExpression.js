"use strict";
var ArrayMatchingMatchExpression = require('./ArrayMatchingMatchExpression.js');

var ElemMatchObjectMatchExpression = module.exports = function ElemMatchObjectMatchExpression(){
	base.call(this);
}, klass = ElemMatchObjectMatchExpression, base = ArrayMatchingMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

proto._sub = undefined;

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString(level){
	var debug = this._debugAddSpace(level);
	debug = debug + this.path() + " $elemMatch (obj)";

	var td = getTag();
	if ( null !== td) {
		debug = debug + " ";
		debug = debug + td;
	}
	debug = debug + "\n";

	return debug + this._sub.debugString(level + 1);
};

/**
 *
 * Return 1 since we have a single "sub"
 * @method numChildren
 *
 */
proto.numChildren = function numChildren(){
	return 1;
};

/**
 *
 * Return the _sub property
 * @method getChild
 * @param i
 *
 */
proto.getChild = function getChild(i){
	return this._sub.get();
};

/**
 *
 * Initialize the necessary items
 * @method init
 * @param path
 * @param type
 *
 */
proto.init = function init(path, sub){
	this._sub = sub;
	return this.initPath(path);
};

/**
 *
 * Check if one of the items in the input array matches _sub
 * @method matchesArray
 * @param anArray
 * @param details
 *
 */
proto.matchesArray = function matchesArray(anArray, details){
	for (var i in anArray) {
		var inner = anArray[i];
		if (!(inner instanceof Object))
			continue;
		if (this._sub.matchesBSON(inner, null)) {
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
 * clone this instance to a new one
 * @method shallowClone
 *
 */
proto.shallowClone = function shallowClone(){
	var element = new ElemMatchObjectMatchExpression();
	element.init(this.path(), this._sub.shallowClone());
	if ( getTag() ){
		element.setTag(getTag().clone());
	}
	return element;
};
