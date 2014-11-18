"use strict";

/**
 * Function order follows that in the header file
 * @class MatchExpression
 * @namespace mungedb-aggregate.matcher
 * @module mungedb-aggregate
 * @constructor
 * @param type {String} The type of the match expression
 */
var MatchExpression = module.exports = function MatchExpression(type){
	this._matchType = type;
}, klass = MatchExpression, proto = klass.prototype;

/**
 * Return the _matchType property
 * @method matchType
 */
proto.matchType = function matchType(){
	return this._matchType;
};

/**
 * Return the number of children we have
 * @method numChildren
 */
proto.numChildren = function numChildren( ){
	return 0;
};


/**
 * Get the i-th child.
 * @method getChild
 */
proto.getChild = function getChild(i) {
	return null;
};

/**
 * Get all the children of a node.
 * @method getChild
 */
proto.getChildVector = function getChildVector(i) {
	return null;
};

/**
 * Get the path of the leaf.  Returns StringData() if there is
 * no path (node is logical).
 * @method path
 */
proto.path = function path( ){
	return "";
};

/*
 * Notes on structure:
 * isLogical, isArray, and isLeaf define three partitions of all possible operators.
 *
 * isLogical can have children and its children can be arbitrary operators.
 *
 * isArray can have children and its children are predicates over one field.
 *
 * isLeaf is a predicate over one field.
 */

/**
 * Is this node a logical operator?  All of these inherit from ListOfMatchExpression.
 * AND, OR, NOT, NOR.
 * @method isLogical
 */
proto.isLogical = function isLogical(){
	switch( this._matchType ){
		case "AND":
		case "OR":
		case "NOT":
		case "NOR":
			return true;
		default:
			return false;
	}
	return false;
};

/**
 * Is this node an array operator?  Array operators have multiple clauses but operate on one
 * field.
 *
 * ALL (AllElemMatchOp)
 * ELEM_MATCH_VALUE, ELEM_MATCH_OBJECT, SIZE (ArrayMatchingMatchExpression)
 * @method isArray
 */
proto.isArray = function isArray(){
	switch (this._matchType){
		case "SIZE":
		case "ALL":
		case "ELEM_MATCH_VALUE":
		case "ELEM_MATCH_OBJECT":
			return true;
		default:
			return false;
	}
	return false;
};

/**
 * Not-internal nodes, predicates over one field.  Almost all of these inherit
 * from LeafMatchExpression.
 *
 * Exceptions: WHERE, which doesn't have a field.
 *             TYPE_OPERATOR, which inherits from MatchExpression due to unique
 * 							array semantics.
 * @method isLeaf
 */
proto.isLeaf = function isLeaf(){
	return !this.isArray() && !this.isLogical();
};

/**
 * XXX: document
 * @method shallowClone
 * @return {MatchExpression}
 * @abstract
 */
proto.shallowClone = function shallowClone() {
	throw new Error("NOT IMPLEMENTED");
};

/**
 * XXX document
 * @method equivalent
 * @return {Boolean}
 * @abstract
 */
proto.equivalent = function equivalent() {
	throw new Error("NOT IMPLEMENTED");
};

//
// Determine if a document satisfies the tree-predicate.
//

/**
 * @method matches
 * @return {Boolean}
 * @abstract
 */
proto.matches = function matches(doc, details/* = 0 */) {
	throw new Error("NOT IMPLEMENTED");
};


/**
 * Wrapper around matches function
 * @method matchesJSON
 */
proto.matchesJSON = function matchesJSON(doc, details/* = 0 */){
	return this.matches(doc, details);
};

/**
 * Determines if the element satisfies the tree-predicate.
 * Not valid for all expressions (e.g. $where); in those cases, returns false.
 * @method matchesSingleElement
 */
proto.matchesSingleElement = function matchesSingleElement(doc) {
	throw new Error("NOT IMPLEMENTED");
};

/**
 * Return the _tagData property
 * @method getTag
 */
proto.getTag = function getTag(){
	return this._tagData;
};

/**
 * Set the _tagData property
 * @method setTag
 * @param data
 */
proto.setTag = function setTag(data){
	this._tagData = data;
};

proto.resetTag = function resetTag() {
	this.setTag(null);
	for(var i=0; i<this.numChildren(); i++) {
		this.getChild(i).resetTag();
	}
};

/**
 * Call the debugString method
 * @method toString
 */
proto.toString = function toString(){
	return this.debugString(0);
};
/**
 * Debug information
 * @method debugString
 */
proto.debugString = function debugString(level) {
	throw new Error("NOT IMPLEMENTED");
};
/**
 * @method _debugAddSpace
 * @param level
 */
proto._debugAddSpace = function _debugAddSpace(level){
	return new Array(level+1).join("    ");
};
