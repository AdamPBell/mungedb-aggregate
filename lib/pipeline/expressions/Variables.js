"use strict";

/**
 * The state used as input and working space for Expressions.
 * @class Variables
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var Variables = module.exports = function Variables(numVars, root){
	if (arguments.length === 0) numVars = 0; // This is only for expressions that use no variables (even ROOT).
	if (typeof numVars !== "number") throw new Error("numVars must be a Number");

	this._root = root || {};
	this._rest = numVars === 0 ? null : new Array(numVars);
	this._numVars = numVars;
}, klass = Variables, proto = klass.prototype;

klass.uassertValidNameForUserWrite = function uassertValidNameForUserWrite(varName) {
	// System variables users allowed to write to (currently just one)
	if (varName === "CURRENT") {
		return;
	}

	if (!varName)
		throw new Error("empty variable names are not allowed; uassert code 16866");

	var firstCharIsValid = (varName[0] >= "a" && varName[0] <= "z") ||
		(varName[0] & "\x80"); // non-ascii

	if (!firstCharIsValid)
		throw new Error("'" + varName + "' starts with an invalid character for a user variable name; uassert code 16867");

	for (var i = 1, l = varName.length; i < l; i++) {
		var charIsValid = (varName[i] >= 'a' && varName[i] <= 'z') ||
			(varName[i] >= 'A' && varName[i] <= 'Z') ||
			(varName[i] >= '0' && varName[i] <= '9') ||
			(varName[i] == '_') ||
			(varName[i] & '\x80'); // non-ascii

		if (!charIsValid)
			throw new Error("'" + varName + "' contains an invalid character " +
				"for a variable name: '" + varName[i] + "'; uassert code 16868");
	}
};

klass.uassertValidNameForUserRead = function uassertValidNameForUserRead(varName) {
	if (!varName)
		throw new Error("empty variable names are not allowed; uassert code 16869");

	var firstCharIsValid = (varName[0] >= "a" && varName[0] <= "z") ||
		(varName[0] >= "A" && varName[0] <= "Z") ||
		(varName[0] & "\x80"); // non-ascii

	if (!firstCharIsValid)
		throw new Error("'" + varName + "' starts with an invalid character for a variable name; uassert code 16870");

	for (var i = 1, l = varName.length; i < l; i++) {
		var charIsValid = (varName[i] >= "a" && varName[i] <= "z") ||
			(varName[i] >= "A" && varName[i] <= "Z") ||
			(varName[i] >= "0" && varName[i] <= "9") ||
			(varName[i] == "_") ||
			(varName[i] & "\x80"); // non-ascii

		if (!charIsValid)
			throw new Error("'" + varName + "' contains an invalid character " +
				"for a variable name: '" + varName[i] + "'; uassert code 16871");
	}
};

/**
 * Inserts a value with the given id
 * @method setValue
 * @param id {Number} The index where the value is stored in the _rest Array
 * @param value {Value} The value to store
 */
proto.setValue = function setValue(id, value) {
	if (typeof id !== "number") throw new Error("id must be a Number");
	if (id === klass.ROOT_ID) throw new Error("can't use Variables#setValue to set ROOT; massert code 17199");
	if (id >= this._numVars) throw new Error("Assertion error");
	this._rest[id] = value;
};

/**
 * Get the value at the given id
 * @method getValue
 * @param id {Number} The index where the value was stored
 * @return {Value} The value
 */
proto.getValue = function getValue(id) {
	if (typeof id !== "number") throw new Error("id must be a Number");
	if (id === klass.ROOT_ID)
		return this._root;
	if (id >= this._numVars) throw new Error("Assertion error");
	return this._rest[id];
};

/**
 * Get the value for id if it's a document
 * @method getDocument
 * @param id {Number} The index where the document was stored
 * @return {Object} The document
 */
proto.getDocument = function getDocument(id) {
	if (typeof id !== "number") throw new Error("id must be a Number");

	if (id === klass.ROOT_ID)
		return this._root;

	if (id >= this._numVars) throw new Error("Assertion error");
	var value = this._rest[id];
	if (value instanceof Object && value.constructor === Object)
		return value;

	return {};
};

klass.ROOT_ID = -1;

/**
 * Use this instead of setValue for setting ROOT
 * @method setRoot
 * @parameter root {Document} The root variable
 */
proto.setRoot = function setRoot(root){
	if (!(root instanceof Object && root.constructor === Object)) throw new Error("Assertion failure");
	this._root = root;
};

/**
 * Clears the root variable
 * @method clearRoot
 */
proto.clearRoot = function clearRoot(){
	this._root = {};
};

/**
 * Gets the root variable
 * @method getRoot
 * @return {Document} the root variable
 */
proto.getRoot = function getRoot(){
	return this._root;
};
