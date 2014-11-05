"use strict";

/**
 * Represents a `Value` (i.e., an `Object`) in `mongo` but in `munge` this is only a set of static helpers since we treat all `Object`s like `Value`s.
 * @class Value
 * @namespace mungedb-aggregate.pipeline
 * @module mungedb-aggregate
 * @constructor
 **/
var Value = module.exports = function Value(){
	if(this.constructor === Value) throw new Error("Never create instances of this! Use the static helpers only.");
}, klass = Value;

var Document; // loaded lazily below //TODO: a dirty hack; need to investigate and clean up

//SKIPPED: ValueStorage -- probably not required; use JSON?
//SKIPPED: createIntOrLong -- not required; use Number
//SKIPPED: operator <Array>[] -- not required; use arr[i]
//SKIPPED: operator <Object>[] -- not required; use obj[key]
//SKIPPED: operator << -- not required
//SKIPPED: addToBsonObj -- not required; use obj[key] = <val>
//SKIPPED: addToBsonArray -- not required; use arr.push(<val>)

/** Coerce a value to a bool using BSONElement::trueValue() rules.
 * Some types unsupported. SERVER-6120
 * @method coerceToBool
 * @static
 */
klass.coerceToBool = function coerceToBool(value) {
	if (typeof value === "string") return true;
	return !!value;	// including null or undefined
};

/**
 * Coercion operators to extract values with fuzzy type logic.
 * These currently assert if called on an unconvertible type.
 * TODO: decided how to handle unsupported types.
 */
klass.coerceToWholeNumber = function coerceToInt(value) {
	return klass.coerceToNumber(value) | 0;
};
klass.coerceToInt = klass.coerceToWholeNumber;
klass.coerceToLong = klass.coerceToWholeNumber;
klass.coerceToNumber = function coerceToNumber(value) {
	if (value === null) return 0;
	switch (Value.getType(value)) {
		case "undefined":
			return 0;
		case "number":
			return value;
		case "Long":
			return parseInt(value.toString(), 10);
		case "Double":
			return parseFloat(value.value, 10);
		default:
			throw new Error("can't convert from BSON type " + Value.getType(value) + " to int; codes 16003, 16004, 16005");
	}
};
klass.coerceToDouble = klass.coerceToNumber;
klass.coerceToDate = function coerceToDate(value) {
	if (value instanceof Date) return value;
	throw new Error("can't convert from BSON type " + Value.getType(value) + " to Date; uassert code 16006");
};
//SKIPPED: coerceToTimeT -- not required; just use Date
//SKIPPED: coerceToTm -- not required; just use Date
//SKIPPED: tmToISODateString -- not required; just use Date
klass.coerceToString = function coerceToString(value) {
	var type = Value.getType(value);
	switch (type) {
		//TODO: BSON numbers?
		case "number":
			return value.toString();

		//TODO: BSON Code?
		//TODO: BSON Symbol?
		case "string":
			return value;

		//TODO: BSON Timestamp?
		case "Date":
			return value.toISOString().split(".")[0];

		case "null":
		case "undefined":
			return "";

		default:
			throw new Error("can't convert from BSON type " + Value.getType(value) + " to String; uassert code 16007");
	}
};
//SKIPPED: coerceToTimestamp

/**
 * Helper function for Value.compare
 * @method cmp
 * @static
 */
var cmp = klass.cmp = function cmp(left, right){
	// The following is lifted directly from compareElementValues
	// to ensure identical handling of NaN
	if (left < right)
		return -1;
	if (left === right)
		return 0;
	if (isNaN(left))
		return isNaN(right) ? 0 : -1;
	return 1;
};

/** Compare two Values.
 * @static
 * @method compare
 * @returns an integer less than zero, zero, or an integer greater than zero, depending on whether lhs < rhs, lhs == rhs, or lhs > rhs
 * Warning: may return values other than -1, 0, or 1
 */
klass.compare = function compare(l, r) {
	var lType = Value.getType(l),
		rType = Value.getType(r),
		ret;

	ret = lType === rType ?
	 	0 // fast-path common case
		: cmp(klass.canonicalize(l), klass.canonicalize(r));

	if(ret !== 0)
		return ret;

	// CW TODO for now, only compare like values
	if (lType !== rType)
		throw new Error("can't compare values of BSON types [" + lType + "] and [" + rType + "]; code 16016");

	switch (lType) {
		// Order of types is the same as in compareElementValues() to make it easier to verify

		// These are valueless types
		//SKIPPED: case "EOO":
		case "undefined":
		case "null":
		//SKIPPED: case "jstNULL":
		case "MaxKey":
		case "MinKey":
			return ret;

		case "boolean":
			return l - r;

		// WARNING: Timestamp and Date have same canonical type, but compare differently.
		// Maintaining behavior from normal BSON.
		//SKIPPED: case "Timestamp": //unsigned-----//TODO: handle case for bson.Timestamp()
		case "Date": // signed
			return cmp(l.getTime(), r.getTime());

        // Numbers should compare by equivalence even if different types
		case "number":
			return cmp(l, r);

        //SKIPPED: case "jstOID":----//TODO: handle case for bson.ObjectID()

        case "Code":
        case "Symbol":
        case "string":
			l = String(l);
			r = String(r);
			return l < r ? -1 : l > r ? 1 : 0;

		case "Object":
			if (Document === undefined) Document = require("./Document");	//TODO: a dirty hack; need to investigate and clean up
			return Document.compare(l, r);

		case "Array":
			var lArr = l,
				rArr = r;

			var elems = Math.min(lArr.length, rArr.length);
			for (var i = 0; i < elems; i++) {
				// compare the two corresponding elements
				ret = Value.compare(lArr[i], rArr[i]);
				if (ret !== 0)
					return ret;
			}
			// if we get here we are either equal or one is prefix of the other
			return cmp(lArr.length, rArr.length);

		//SKIPPED: case "DBRef":-----//TODO: handle case for bson.DBRef()
		//SKIPPED: case "BinData":-----//TODO: handle case for bson.BinData()

		case "RegExp": // same as String in this impl but keeping order same as compareElementValues
			l = String(l);
			r = String(r);
			return l < r ? -1 : l > r ? 1 : 0;

		//SKIPPED: case "CodeWScope":-----//TODO: handle case for bson.CodeWScope()
	}
	throw new Error("Assertion failure");
};

//SKIPPED: hash_combine
//SKIPPED: getWidestNumeric
//SKIPPED: getApproximateSize
//SKIPPED: toString
//SKIPPED: operator <<
//SKIPPED: serializeForSorter
//SKIPPED: deserializeForSorter

/**
 * Takes an array and removes items and adds them to returned array.
 * @method consume
 * @static
 * @param consumed {Array} The array to be copied, emptied.
 **/
klass.consume = function consume(consumed) {
	return consumed.splice(0);
};

//NOTE: DEVIATION FROM MONGO: many of these do not apply or are inlined (code where relevant)
// missing(val): val === undefined
// nullish(val): val === null || val === undefined
// numeric(val): typeof val === "number"
klass.getType = function getType(v) {
	var t = typeof v;
	if (t !== "object")
		return t;
	if (v === null)
		return "null";
	return v.constructor.name || t;
};
// getArrayLength(arr): arr.length
// getString(val): val.toString() //NOTE: same for getStringData(val) I think
// getOid
// getBool
// getDate
// getTimestamp
// getRegex(re): re.source
// getRegexFlags(re): re.toString().slice(-re.toString().lastIndexOf('/') + 2)
// getSymbol
// getCode
// getInt
// getLong
//NOTE: also, because of this we are not throwing if the type does not match like the mongo code would but maybe that's okay

// from bsontypes
klass.canonicalize = function canonicalize(x) {
	var xType = Value.getType(x);
	switch (xType) {
		case "MinKey":
			return -1;
		case "MaxKey":
			return 127;
		case "EOO":
		case "undefined":
		case undefined:
			return 0;
		case "jstNULL":
		case "null":
		case "Null":
			return 5;
		case "NumberDouble":
		case "NumberInt":
		case "NumberLong":
		case "number":
			return 10;
		case "Symbol":
		case "string":
			return 15;
		case "Object":
			return 20;
		case "Array":
			return 25;
		case "Binary":
			return 30;
		case "ObjectId":
			return 35;
		case "ObjectID":
			return 35;
		case "boolean":
		case "Boolean":
			return 40;
		case "Date":
		case "Timestamp":
			return 45;
		case "RegEx":
		case "RegExp":
			return 50;
		case "DBRef":
			return 55;
		case "Code":
			return 60;
		case "CodeWScope":
			return 65;
		default:
			// Default value for Object
			return 20;
	}
};
