"use strict";

/**
 * Class that stores/tracks variables
 * @class Variables
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var Variables = module.exports = function Variables(numVars, root){
	if(numVars) {
		if(typeof numVars !== 'number') {
			throw new Error('numVars must be a number');
		}
	}
	this._root = root || {};
	this._rest = numVars ? [] : undefined; //An array of `Value`s
	this._numVars = numVars;
}, klass = Variables,
	base = Object,
	proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});


klass.ROOT_ID = -1;

// PROTOTYPE MEMBERS

/**
 * Sets the root variable
 * @method setRoot
 * @parameter root {Document} The root variable
 **/
proto.setRoot = function setRoot(root){
	if(!(root instanceof Object && root.constructor.name === 'Object')) { //NOTE: Type checking cause c++ does this for you
		throw new Error('root must be an Object');
	}
	this._root = root;
};

/**
 * Clears the root variable
 * @method clearRoot
 **/
proto.clearRoot = function clearRoot(){
	this._root = {};
};

/**
 * Gets the root variable
 * @method getRoot
 * @return {Document} the root variable
 **/
proto.getRoot = function getRoot(){
	return this._root;
};

/**
 * Inserts a value with the given id
 * @method setValue
 * @param id {Number} The index where the value is stored in the _rest Array
 * @param value {Value} The value to store
 **/
proto.setValue = function setValue(id, value) {
	//NOTE: Some added type enforcement cause c++ does this for you
	if(typeof id !== 'number') {
		throw new Error('id must be a Number');
	}

	if(id === klass.ROOT_ID) {
		throw new Error("mError 17199: can't use Variables#setValue to set ROOT");
	}
	if(id >= this._numVars) { // a > comparator would be off-by-one; i.e. if we have 5 vars, the max id would be 4
		throw new Error("You have more variables than _numVars");
	}

	this._rest[id] = value;
};

/**
 * Get the value at the given id
 * @method getValue
 * @param id {Number} The index where the value was stored
 * @return {Value} The value
 **/
proto.getValue = function getValue(id) {
	//NOTE: Some added type enforcement cause c++ does this for you
	if(typeof id !== 'number') {
		throw new Error('id must be a Number');
	}

	if(id === klass.ROOT_ID) {
		return this._root;
	}
	if(id >= this._numVars) { // a > comparator would be off-by-one; i.e. if we have 5 vars, the max id would be 4
		throw new Error("Cannot get value; id was greater than _numVars");
	}

	return this._rest[id];
};


/**
 * Get the value for id if it's a document
 * @method getDocument
 * @param id {Number} The index where the document was stored
 * @return {Object} The document
 **/
proto.getDocument = function getDocument(id) {
	//NOTE: Some added type enforcement cause c++ does this for you
	if(typeof id !== 'number') {
		throw new Error('id must be a Number');
	}

	if(id === klass.ROOT_ID) {
		return this._root;
	}
	if(id >= this._numVars) { // a > comparator would be off-by-one; i.e. if we have 5 vars, the max id would be 4
		throw new Error("Cannot get value; id was greater than _numVars");
	}

	var value = this._rest[id];
	if(typeof value === 'object' && value.constructor.name === 'Object') {
		return value;
	}
	return {};
};
