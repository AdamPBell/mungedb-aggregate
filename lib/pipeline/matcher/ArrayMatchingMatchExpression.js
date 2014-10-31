"use strict";

var MatchExpression = require('./MatchExpression');

var ArrayMatchingMatchExpression = module.exports = function ArrayMatchingMatchExpression(matchType){
	base.call(this);
	this._matchType = matchType;
	this._elementPath = new ElementPath();
}, klass = ArrayMatchingMatchExpression, base = MatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var errors = require("../../Errors.js"),
	ErrorCodes = errors.ErrorCodes,
	ElementPath = require('./ElementPath.js');

proto._path = undefined;

/**
 *
 * Initialize the input path as our element path
 * @method initPath
 * @param path
 *
 */
proto.initPath = function initPath(path){
	this._path = path;
	var status = this._elementPath.init(this._path);
	this._elementPath.setTraverseLeafArray(false);
	return status;
};

/**
 *
 * matches checks the input doc against the internal path to see if it is a match
 * @method matches
 * @param doc
 * @param details
 *
 */
 proto.matches = function matches(doc, details){
	var self = this,
		checker = function(element) {
			// we got the whole path, now check it
			if (!(element instanceof Array))
				return false;

			//var amIRoot = (element.length === 0);

			if (!self.matchesArray(element, details))
				return false;

			/*
			if (!amIRoot && details && details.needRecord() {
				details.setElemMatchKey(element);
			}
			*/
			return true;
		};
	return this._elementPath._matches(doc, details, checker);
};
// proto.matches = function matches(doc, details){
// var cursor = doc[this._elementPath];

// 	for (var i = 0; i < cursor.length; i++){
// 		var e = cursor[i];

// 		if (!(e.element().type() !== Array)){  //TODO 
// 			continue;
// 		}

// 		var amIRoot = e.arrayOffset().eoo();

// 		if (!(matchesArray(e.element().Obj() , amIRoot ? details : null) )){
// 			continue;
// 		}

// 		if (!amIRoot && details && details.needRecord() && !e.arrayOffset().eoo() ){
// 			details.setElemMatchKey(e.arrayOffset().fieldName() );
// 		}

// 		return true;
// 	};

// 	return false;
// };

/**
 *
 * Check if the input element matches
 * @method matchesSingleElement
 * @param
 *
 */
proto.matchesSingleElement = function matchesSingleElement(element){
	if (!(element instanceof Array)){
		return false;
	}

	return this.matchesArray(element, null);
};

/**
 *
 * Check if the input element is equivalent to us
 * @method equivalent
 * @param
 *
 */
proto.equivalent = function equivalent(other){
	if ( this._matchType != other._matchType)
		return false;

	var realOther = new ArrayMatchingMatchExpression(other);

	if (this._path != realOther._path)
		return false;

	if (this.numChildren() != realOther.numChildren())
		return false;

	for (var i = 0; i < this.numChildren(); i++)
		if (! (this.getChild(i).equivalent(realOther.getChild(i)) ) )
			return false;
	return true;
};

/**
 *
 * return the internal path
 * @method path
 * @param
 *
 */
proto.path = function path(){
	return this._path;
};

/**
 *
 * Check if the input array matches
 * @method path
 * @param anArray
 * @param details
 *
 */
proto.matchesArray = function matchesArray(anArray, details){
	throw new Error("not implemented");
};
