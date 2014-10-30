"use strict";

/**
 * Represents a `Document` (i.e., an `Object`) in `mongo` but in `munge` this is only a set of static helpers since we treat all `Object`s like `Document`s.
 * @class Document
 * @namespace mungedb-aggregate.pipeline
 * @module mungedb-aggregate
 * @constructor
 **/
var Document = module.exports = function Document(){
	if(this.constructor == Document) throw new Error("Never create instances! Use static helpers only.");
}, klass = Document, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("./Value"),
	FieldPath = require("./FieldPath");

/**
 * Shared "_id"
 * @static
 * @property ID_PROPERTY_NAME
 **/
klass.ID_PROPERTY_NAME = "_id";

//SKIPPED: DocumentStorage

/**
 * Return JSON representation of this Document
 * @method toJson
 * @returns {Object} JSON representation of this Document
 **/
klass.toJson = function toJson(doc) {
 	return JSON.parse(JSON.stringify(doc));
};

//SKIPPED: metaFieldTextScore
//SKIPPED: toBsonWithMetaData
//SKIPPED: fromBsonWithMetaData

//SKIPPED: most of MutableDocument except for getNestedField and setNestedField, squashed into Document here (because that's how they use it)
function getNestedFieldHelper(obj, path) {
	// NOTE: DEVIATION FROM MONGO: from MutableDocument; similar but necessarily different
	var keys = Array.isArray(path) ? path : (path instanceof FieldPath ? path.fields : path.split(".")),
		lastKey = keys[keys.length - 1];
	for (var i = 0, l = keys.length - 1, cur = obj; i < l && cur instanceof Object; i++) {
		var next = cur[keys[i]];
		if (!(next instanceof Object)) return undefined;
		cur = next;
	}
	return cur[lastKey];
}
klass.getNestedField = getNestedFieldHelper;  // NOTE: ours is static so these are the same
klass.setNestedField = function setNestedField(obj, path, val) {
	// NOTE: DEVIATION FROM MONGO: from MutableDocument; similar but necessarily different
	var keys = Array.isArray(path) ? path : (path instanceof FieldPath ? path.fields : path.split(".")),
		lastKey = keys[keys.length - 1];
	for (var i = 0, l = keys.length - 1, cur = obj; i < l && cur instanceof Object; i++) {
		var next = cur[keys[i]];
		if (!(next instanceof Object)) cur[keys[i]] = next = {};
		cur = next;
	}
	cur[lastKey] = val;
	return val;
};
//SKIPPED: getApproximateSize -- not implementing mem usage right now
//SKIPPED: hash_combine

/** Compare two documents.
 *
 *  BSON document field order is significant, so this just goes through
 *  the fields in order.  The comparison is done in roughly the same way
 *  as strings are compared, but comparing one field at a time instead
 *  of one character at a time.
 *
 *  Note: This does not consider metadata when comparing documents.
 *
 * @method compare
 * @static
 * @param l {Object}  left document
 * @param r {Object} right document
 * @returns an integer less than zero, zero, or an integer greater than
 *           zero, depending on whether lhs < rhs, lhs == rhs, or lhs > rhs
 *  Warning: may return values other than -1, 0, or 1
 */
klass.compare = function compare(l, r){	//TODO: might be able to replace this with a straight compare of docs using JSON.stringify()
	var lPropNames = Object.getOwnPropertyNames(l),
		lPropNamesLength = lPropNames.length,
		rPropNames = Object.getOwnPropertyNames(r),
		rPropNamesLength = rPropNames.length;

	for(var i = 0; true; ++i) {
		if (i >= lPropNamesLength) {
			if (i >= rPropNamesLength) return 0; // documents are the same length
			return -1; // left document is shorter
		}

		if (i >= rPropNamesLength) return 1; // right document is shorter

		var rField = rPropNames[i],
			lField = lPropNames[i];
		var nameCmp = Value.compare(lField, rField);
		if (nameCmp !== 0) return nameCmp; // field names are unequal

		var valueCmp = Value.compare(l[lPropNames[i]], r[rField]);
		if (valueCmp) return valueCmp; // fields are unequal
	}
};

//SKIPPED: toString

klass.serializeForSorter = function serializeForSorter(doc) {
	//NOTE: DEVIATION FROM MONGO: they take a buffer to output the current instance into, ours is static and takes a doc and returns the serialized output
	return JSON.stringify(doc);
};

klass.deserializeForSorter = function deserializeForSorter(docStr, sorterDeserializeSettings) {
	return JSON.parse(docStr);
};

//SKIPPED: swap
//SKIPPED: []
//SKIPPED: getField -- inline as:  obj[key]
//SKIPPED: getNestedField -- use fieldPath? might need to implement this...
//SKIPPED: size -- need this? Number of fields in this document. O(n) -- recursive
klass.empty = function(obj) {
	return Object.keys(obj).length === 0;
};
//SKIPPED: operator <<
//SKIPPED: positionOf

/**
 * Clone a document
 * This should only be called by MutableDocument and tests
 * The new document shares all the fields' values with the original.
 * This is not a deep copy.  Only the fields on the top-level document
 * are cloned.
 * @static
 * @method clone
 * @param doc
 */
klass.clone = function clone(doc) {
	var obj = {};
	for (var key in doc) {
		if (doc.hasOwnProperty(key)) {
			obj[key] = doc[key];
		}
	}
	return obj;
};
klass.cloneDeep = function cloneDeep(doc) {	//there are casese this is actually what we want
	var obj = {};
	for (var key in doc) {
		if (doc.hasOwnProperty(key)) {
			var val = doc[key];
			obj[key] = val instanceof Object && val.constructor === Object ? Document.clone(val) : val;
		}
	}
	return obj;
};

//SKIPPED: hasTextScore
//SKIPPED: getTextScore

//SKIPPED: memUsageForSorter -- not implementing mem usage right now
//SKIPPED: getOwned -- not implementing mem usage right now

//SKIPPED: getPtr
