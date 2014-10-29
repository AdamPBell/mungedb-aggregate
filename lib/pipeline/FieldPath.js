"use strict";

/**
 * Constructor for field paths.
 *
 * The constructed object will have getPathLength() > 0.
 * Uassert if any component field names do not pass validation.
 *
 * @class FieldPath
 * @namespace mungedb-aggregate.pipeline
 * @module mungedb-aggregate
 * @constructor
 * @param fieldPath the dotted field path string or non empty pre-split vector.
 */
var FieldPath = module.exports = function FieldPath(path) {
	var fieldNames = typeof path === "object" && typeof path.length === "number" ? path : path.split(".");
	if (fieldNames.length === 0) throw new Error("FieldPath cannot be constructed from an empty vector (String or Array).; massert code 16409");
	this.fieldNames = [];
	for (var i = 0, n = fieldNames.length; i < n; ++i) {
		this._pushFieldName(fieldNames[i]);
	}
}, klass = FieldPath, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.PREFIX = "$";

/**
 * Get the full path.
 * @method getPath
 * @param fieldPrefix whether or not to include the field prefix
 * @returns the complete field path
 */
proto.getPath = function getPath(fieldPrefix) {
	return (!!fieldPrefix ? FieldPath.PREFIX : "") + this.fieldNames.join(".");
};

//SKIPPED: writePath - merged into getPath

/**
 * A FieldPath like this but missing the first element (useful for recursion). Precondition getPathLength() > 1.
 * @method tail
 */
proto.tail = function tail() {
	return new FieldPath(this.fieldNames.slice(1));
};

/**
 * Get a particular path element from the path.
 * @method getFieldName
 * @param i the zero based index of the path element.
 * @returns the path element
 */
proto.getFieldName = function getFieldName(i) {	//TODO: eventually replace this with just using .fieldNames[i] directly
	return this.fieldNames[i];
};

klass._uassertValidFieldName = function _uassertValidFieldName(fieldName) {
	if (fieldName.length === 0) throw new Error("FieldPath field names may not be empty strings; code 15998");
	if (fieldName[0] === "$") throw new Error("FieldPath field names may not start with '$'; code 16410");
	if (fieldName.indexOf("\0") !== -1) throw new Error("FieldPath field names may not contain '\\0'; code 16411");
	if (fieldName.indexOf(".") !== -1) throw new Error("FieldPath field names may not contain '.'; code 16412");
};

proto._pushFieldName = function _pushFieldName(fieldName) {
	klass._uassertValidFieldName(fieldName);
	this.fieldNames.push(fieldName);
};

/**
 * Get the number of path elements in the field path.
 * @method getPathLength
 * @returns the number of path elements
 */
proto.getPathLength = function getPathLength() {
	return this.fieldNames.length;
};
