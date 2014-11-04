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
}, klass = Value, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Document;  // loaded lazily below //TODO: a dirty hack; need to investigate and clean up

//SKIPPED: ValueStorage -- probably not required; use JSON?
//SKIPPED: createIntOrLong -- not required; use Number
//SKIPPED: operator <Array>[] -- not required; use arr[i]
//SKIPPED: operator <Object>[] -- not required; use obj[key]
//SKIPPED: operator << -- not required
//SKIPPED: addToBsonObj -- not required; use obj[key] = <val>
//SKIPPED: addToBsonArray -- not required; use arr.push(<val>)

/** Coerce a value to a bool using BSONElement::trueValue() rules.
 * Some types unsupported.  SERVER-6120
 * @method coerceToBool
 * @static
 */
klass.coerceToBool = function coerceToBool(value) {
	if (typeof value === "string") return true;
	return !!value;	// including null or undefined
};

/** Coercion operators to extract values with fuzzy type logic.
 *  These currently assert if called on an unconvertible type.
 *  TODO: decided how to handle unsupported types.
 */
klass.coerceToWholeNumber = function coerceToInt(value) {
	return klass.coerceToNumber(value) | 0;
};
klass.coerceToInt = klass.coerceToWholeNumber;
klass.coerceToLong = klass.coerceToWholeNumber;
klass.coerceToNumber = function coerceToNumber(value) {
	if (value === null) return 0;
	switch (typeof(value)) {
	case "undefined":
		return 0;
	case "number":
		return value;
	case "object":
		switch (value.constructor.name) {
			case "Long":
				return parseInt(value.toString(), 10);
			case "Double":
				return parseFloat(value.value, 10);
			default:
				throw new Error("can't convert from BSON type " + value.constructor.name + " to int; codes 16003, 16004, 16005");
		}
		return value;
	default:
		throw new Error("can't convert from BSON type " + typeof(value) + " to int; codes 16003, 16004, 16005");
	}
};
klass.coerceToDouble = klass.coerceToNumber;
klass.coerceToDate = function coerceToDate(value) {
	if (value instanceof Date) return value;
	throw new Error("can't convert from BSON type " + typeof(value) + " to Date; uassert code 16006");
};
//SKIPPED: coerceToTimeT -- not required; just use Date
//SKIPPED: coerceToTm -- not required; just use Date
//SKIPPED: tmToISODateString -- not required; just use Date
klass.coerceToString = function coerceToString(value) {
	var type = typeof(value);
	if (type === "object") type = value === null ? "null" : value.constructor.name;
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
			throw new Error("can't convert from BSON type " + typeof(value) + " to String; uassert code 16007");
	}
};
//SKIPPED: coerceToTimestamp

/**
 * Helper function for Value.compare
 * @method cmp
 * @static
 */
klass.cmp = function cmp(l, r){
	return l < r ? -1 : l > r ? 1 : 0;
};

/** Compare two Values.
 * @static
 * @method compare
 * @returns an integer less than zero, zero, or an integer greater than zero, depending on whether lhs < rhs, lhs == rhs, or lhs > rhs
 * Warning: may return values other than -1, 0, or 1
 */
klass.compare = function compare(l, r) {
	//NOTE: deviation from mongo code: we have to do some coercing for null "types" because of javascript
	var lt = l === null ? "null" : typeof(l),
		rt = r === null ? "null" : typeof(r),
		ret;

	// NOTE: deviation from mongo code: javascript types do not work quite the same, so for proper results we always canonicalize, and we don't need the "speed" hack
	ret = (klass.cmp(klass.canonicalize(l), klass.canonicalize(r)));

	if(ret !== 0) return ret;

	// Numbers
	if (lt === "number" && rt === "number"){
		//NOTE: deviation from Mongo code: they handle NaN a bit differently
		if (isNaN(l)) return isNaN(r) ? 0 : -1;
		if (isNaN(r)) return 1;
		return klass.cmp(l,r);
	}
	// Compare MinKey and MaxKey cases
	if (l instanceof Object && ["MinKey", "MaxKey"].indexOf(l.constructor.name) !== -1) {
		if (l.constructor.name === r.constructor.name) {
			return 0;
		} else if (l.constructor.name === "MinKey") {
			return -1;
		} else {
			return 1; // Must be MaxKey, which is greater than everything but MaxKey (which r cannot be)
		}
	}
	// hack: These should really get converted to their BSON type ids and then compared, we use int vs object in queries
	if (lt === "number" && rt === "object"){
		return -1;
	} else if (lt === "object" && rt === "number") {
		return 1;
	}
	// CW TODO for now, only compare like values
	if (lt !== rt) throw new Error("can't compare values of BSON types [" + lt + " " + l.constructor.name + "] and [" + rt + ":" + r.constructor.name + "]; code 16016");
	// Compare everything else
	switch (lt) {
	case "number":
		throw new Error("number types should have been handled earlier!");
	case "string":
		return klass.cmp(l, r);
	case "boolean":
		return l === r ? 0 : l ? 1 : -1;
	case "undefined": //NOTE: deviation from mongo code: we are comparing null to null or undefined to undefined (otherwise the ret stuff above would have caught it)
	case "null":
		return 0;
	case "object":
		if (l instanceof Array) {
			for (var i = 0, ll = l.length, rl = r.length; true ; ++i) {
				if (i > ll) {
					if (i > rl) return 0; // arrays are same length
					return -1; // left array is shorter
				}
				if (i > rl) return 1; // right array is shorter
				var cmp = Value.compare(l[i], r[i]);
				if (cmp !== 0) return cmp;
			}

			throw new Error("logic error in Value.compare for Array types!");
		}
		if (l instanceof Date) return klass.cmp(l,r);
		if (l instanceof RegExp) return klass.cmp(l,r);
		if (Document === undefined) Document = require("./Document");	//TODO: a dirty hack; need to investigate and clean up
		return Document.compare(l, r);
	default:
		throw new Error("unhandled left hand type:" + lt);
	}

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
// missing(val):  val === undefined
// nullish(val):  val === null || val === undefined
// numeric(val):  typeof val === "number"
klass.getType = function getType(v) {
	var t = typeof v;
	if (t === "object") t = (v === null ? "null" : v.constructor.name || t);
	return t;
};
// getArrayLength(arr): arr.length
// getString(val): val.toString()   //NOTE: same for getStringData(val) I think
// getOid
// getBool
// getDate
// getTimestamp
// getRegex(re):  re.source
// getRegexFlags(re):  re.toString().slice(-re.toString().lastIndexOf('/') + 2)
// getSymbol
// getCode
// getInt
// getLong
//NOTE: also, because of this we are not throwing if the type does not match like the mongo code would but maybe that's okay

// from bsontypes
klass.canonicalize = function canonicalize(x) {
	var xType = typeof(x);
	if (xType === "object") xType = x === null ? "null" : x.constructor.name;
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
