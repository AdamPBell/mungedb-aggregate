"use strict";

/**
 * This class is designed to quickly extract the needed fields into a Document.
 * It should only be created by a call to DepsTracker.toParsedDeps.
 *
 * @class ParsedDeps
 * @namespace mungedb-aggregate.pipeline
 * @module mungedb-aggregate
 * @constructor
 * @param {Object} fields	The fields needed in a Document
 */
var ParsedDeps = module.exports = function ParsedDeps(fields) {
	this._fields = fields;
}, klass = ParsedDeps, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("./Value");

/**
 * Extracts fields from the input into a new Document, based on the caller.
 * @method extractFields
 * @param {Object} input	The JSON object to extract from
 * @return {Document}
 */
proto.extractFields = function extractFields(input) {
	return proto._documentHelper(input, this._fields);
};

/**
 * Handles array-type values for extractFields()
 * Mutually recursive with arrayHelper
 * @method _arrayHelper
 * @private
 * @param {Object} array	Array to iterate over
 * @param {Object} neededFields
 * @return {Array}
 */
proto._arrayHelper = function _arrayHelper(array, neededFields) {
	var values = [];
	for (var i = 0, l = array.length; i < l; i++) {
		var jsonElement = array[i];
		if (Value.getType(jsonElement) === "Object") {
			var sub = this._documentHelper(jsonElement, neededFields);
			values.push(sub);
		}

		if (Value.getType(jsonElement) === "Array") {
			values.push(this._arrayHelper(jsonElement, neededFields));
		}
	}

	return values;
};

/**
 * Handles object-type values for extractFields()
 * @method _documentHelper
 * @private
 * @param {Object} json	Object to iterate over and filter
 * @param {Object} neededFields	Fields to not exclude
 * @return {Document}
 */
proto._documentHelper = function _documentHelper(json, neededFields) {
	var md = {};

	for (var fieldName in json) { //jshint ignore:line
		var jsonElement = json[fieldName],
			isNeeded = neededFields[fieldName];

		if (isNeeded === undefined)
			continue;

		if (typeof isNeeded === "boolean") {
			md[fieldName] = jsonElement;
			continue;
		}

		if (!(isNeeded instanceof Object)) throw new Error("dassert failure");

		if (Value.getType(jsonElement) === "Object") {
			var sub = this._documentHelper(jsonElement, isNeeded);
			md[fieldName] = sub;
		}

		if (Value.getType(jsonElement) === "Array") {
			md[fieldName] = this._arrayHelper(jsonElement, isNeeded);
		}
	}

	return md;
};
