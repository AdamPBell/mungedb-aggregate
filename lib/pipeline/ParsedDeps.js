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

/**
 * Extracts fields from the input into a new Document, based on the caller.
 *
 * @method extractFields
 * @param {Object} input	The JSON object to extract from
 * @return {Document}
 */
proto.extractFields = function extractFields(input) {
	return proto._documentHelper(input, this._fields);
};

/**
 * Private: Handles array-type values for extractFields()
 *
 * @method _arrayHelper
 * @param {Object} array	Array to iterate over
 * @param {Object} neededFields
 * @return {Array}
 */
proto._arrayHelper = function _arrayHelper(array, neededFields) {
	var values = [];

	array.sort().forEach(function (it) {
		if (it instanceof Array)
			values.push(_arrayHelper(it, neededFields));
		else if (it instanceof Object)
			values.push(proto._documentHelper(it, neededFields));
	});

	return values;
};

/**
 * Private: Handles object-type values for extractFields()
 *
 * @method _documentHelper
 * @param {Object} json	Object to iterate over and filter
 * @param {Object} neededFields	Fields to not exclude
 * @return {Document}
 */
proto._documentHelper = function _documentHelper(json, neededFields) {
	var doc = {};

	Object.keys(json).sort().forEach(function (it) {
		var jsonElement = json[it],
			isNeeded = neededFields[it];

		if (!isNeeded)
			return;

		if (typeof(isNeeded) === 'boolean') {
			doc[it] = jsonElement;
			return;
		}

		if (typeof(isNeeded) === 'object') {
			if (jsonElement instanceof Array)
				doc[it] = proto._arrayHelper(jsonElement, isNeeded);
			if (jsonElement instanceof Object)
				doc[it] = proto._documentHelper(jsonElement, isNeeded);
		}
	});

	return doc;
};
