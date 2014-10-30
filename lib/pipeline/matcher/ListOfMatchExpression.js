"use strict";

var MatchExpression = require('./MatchExpression');

/**
 * Create a match expression to match a list of
 * @class ListOfMatchExpression
 * @namespace mungedb-aggregate.pipeline.matcher
 * @module mungedb-aggregate
 * @constructor
 */
vvar ListOfMatchExpression = module.exports = function ListOfMatchExpression(matchType){
	base.call(this);
	this._expressions = [];
	this._matchType = matchType;
}, klass = ListOfMatchExpression, base =  MatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

proto._expressions = undefined;

/**
 *
 * Append a new expression to our list
 * @method add
 * @param Expression
 *
 */
proto.add = function add( exp ){
	// verify(expression)
	if(!exp)
		throw new Error(exp + " failed verify on ListOfMatchExpression:add:30");
	if(this._expressions) {
		this._expressions.push(exp);
	} else {
		this._expressions = [exp];
	}

};

/**
 *
 * Empty us out
 * @method clearAndRelease
 *
 */
proto.clearAndRelease = function clearAndRelease(){
	this._expressions = []; // empty the expressions
};

/**
 *
 * Get the length of the list
 * @method numChildren
 * @param
 *
 */
proto.numChildren = function numChildren(){
	return this._expressions.length;
};

/**
 *
 * Get an item from the expressions
 * @method getChild
 * @param i index of the child
 *
 */
proto.getChild = function getChild(i){
	return this._expressions[i];
};

/**
 *
 * Get the expressions
 * @method getChildVector
 * @param
 *
 */
proto.getChildVector = function getChildVector(){
	return this._expressions;
};

/**
 *
 * Print the debug info from each expression in the list
 * @method _debugList
 * @param level
 *
 */
proto._debugList = function _debugList(debug, level){
	for (var i = 0; i < this._expressions.length; i++ )
		this._expressions[i].debugString(debug, level + 1);
};

/**
 *
 * Check if the input list is considered the same as this one
 * @method equivalent
 * @param other
 *
 */
proto.equivalent = function equivalent(other){
	if (this._matchType != other._matchType)
		return false;

	var realOther = new ListOfMatchExpression(other);

	if (this._expressions.length != realOther._expressions.length)
		return false;

	// TODO: order doesn't matter
	for (var i = 0; i < this._expressions.length; i++ )
		if (!this._expressions[i].equivalent(realOther._expressions[i]))
			return false;

	return true;
};