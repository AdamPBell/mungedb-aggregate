"use strict";

var Expression = require("./Expression"),
	Variables = require("./Variables"),
	FieldPath = require("../FieldPath");

/**
 * Create a field path expression.
 *
 * Evaluation will extract the value associated with the given field
 * path from the source document.
 *
 * @class FieldPathExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @extends mungedb-aggregate.pipeline.expressions.Expression
 * @constructor
 * @param {String} theFieldPath the field path string, without any leading document indicator
 */
var FieldPathExpression = module.exports = function FieldPathExpression(theFieldPath, variable) {
	if (arguments.length !== 2) throw new Error(klass.name + ": expected args: theFieldPath[, variable]");
	this._fieldPath = new FieldPath(theFieldPath);
	this._variable = variable;
}, klass = FieldPathExpression, base = Expression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

/**
 * Create a field path expression using old semantics (rooted off of CURRENT).
 *
 * // NOTE: this method is deprecated and only used by tests
 * // TODO remove this method in favor of parse()
 *
 * Evaluation will extract the value associated with the given field
 * path from the source document.
 *
 * @param fieldPath the field path string, without any leading document
 * indicator
 * @returns the newly created field path expression
 */
klass.create = function create(fieldPath) {
	return new FieldPathExpression("CURRENT." + fieldPath, Variables.ROOT_ID);
};

// this is the new version that supports every syntax
/**
 * Like create(), but works with the raw string from the user with the "$" prefixes.
 * @param raw raw string fieldpath
 * @param vps variablesParseState
 * @returns a new FieldPathExpression
 */
klass.parse = function parse(raw, vps) {

	if (raw[0] !== "$") // raw[0] is always a valid reference
		throw new Error("FieldPath: '" + raw + "' doesn't start with a $; uassert code 16873");

	if (raw.length < 2) // need at least "$" and either "$" or a field name
		throw new Error("'$' by itself is not a valid FieldPath; uassert code 16872");

	if (raw[1] === "$") {
		var fieldPath = raw.substr(2), // strip off $$
			dotIndex = fieldPath.indexOf("."),
			varName = fieldPath.substr(0, dotIndex !== -1 ? dotIndex : fieldPath.length);
		Variables.uassertValidNameForUserRead(varName);
		return new FieldPathExpression(fieldPath, vps.getVariable(varName));
	} else {
		return new FieldPathExpression("CURRENT." + raw.substr(1), // strip the "$" prefix
			vps.getVariable("CURRENT"));
	}
};

proto.optimize = function optimize() {
	// nothing can be done for these
	return this;
};

proto.addDependencies = function addDependencies(deps) {
	if (this._variable === Variables.ROOT_ID) {
		if (this._fieldPath.fieldNames.length === 1) {
			deps.needWholeDocument = true; // need full doc if just "$$ROOT"
		} else {
			deps.fields[this._fieldPath.tail().getPath(false)] = 1;
		}
	}
};

/**
 * Helper for evaluatePath to handle Array case
 */
proto._evaluatePathArray = function _evaluatePathArray(index, input) {
	if (!(input instanceof Array)) throw new Error("must be array; dassert");

	// Check for remaining path in each element of array
	var result = [];
	for (var i = 0, l = input.length; i < l; i++) {
		if (!(input[i] instanceof Object))
			continue;

		var nested = this._evaluatePath(index, input[i]);
		if (nested !== undefined)
			result.push(nested);
	}
	return result;
};

/**
 * Internal implementation of evaluateInternal(), used recursively.
 *
 * The internal implementation doesn't just use a loop because of
 * the possibility that we need to skip over an array.  If the path
 * is "a.b.c", and a is an array, then we fan out from there, and
 * traverse "b.c" for each element of a:[...].  This requires that
 * a be an array of objects in order to navigate more deeply.
 *
 * @param index current path field index to extract
 * @param input current document traversed to (not the top-level one)
 * @returns the field found; could be an array
 */
proto._evaluatePath = function _evaluatePath(index, input) {
	// Note this function is very hot so it is important that is is well optimized.
	// In particular, all return paths should support RVO.

	// if we've hit the end of the path, stop
	if (index === this._fieldPath.fieldNames.length - 1)
		return input[this._fieldPath.fieldNames[index]];

	// Try to dive deeper
	var val = input[this._fieldPath.fieldNames[index]];
	if (val instanceof Object && val.constructor === Object) {
		return this._evaluatePath(index + 1, val);
	} else if (val instanceof Array) {
		return this._evaluatePathArray(index + 1, val);
	} else {
		return undefined;
	}
};

proto.evaluateInternal = function evaluateInternal(vars) {
	if (this._fieldPath.fieldNames.length === 1) // get the whole variable
		return vars.getValue(this._variable);

	if (this._variable === Variables.ROOT_ID) {
		// ROOT is always a document so use optimized code path
		return this._evaluatePath(1, vars.getRoot());
	}

	var val = vars.getValue(this._variable);
	if (val instanceof Object && val.constructor === Object) {
		return this._evaluatePath(1, val);
	} else if(val instanceof Array) {
		return this._evaluatePathArray(1,val);
	} else {
		return undefined;
	}
};

proto.serialize = function serialize(){
	if(this._fieldPath.fieldNames[0] === "CURRENT" && this._fieldPath.fieldNames.length > 1) {
		// use short form for "$$CURRENT.foo" but not just "$$CURRENT"
		return "$" + this._fieldPath.tail().getPath(false);
	} else {
		return "$$" + this._fieldPath.getPath(false);
	}
};

proto.getFieldPath = function getFieldPath(){
	return this._fieldPath;
};
