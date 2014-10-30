"use strict";

/**
 * Represents a `Value` (i.e., an `Object`) in `mongo` but in `munge` this is only a set of static helpers since we treat all `Object`s like `Value`s.
 * @class Value
 * @namespace mungedb-aggregate.pipeline
 * @module mungedb-aggregate
 * @constructor
 **/
var Value = module.exports = function Value(){
	if(this.constructor == Value) throw new Error("Never create instances of this! Use the static helpers only.");
}, klass = Value, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// PRIVATE STUFF
function getTypeVerifier(type, IClass, isStrict) {
	return function verifyType(value) {
		if (typeof(value) != type) throw new Error("typeof value is not: " + type + "; actual: " + typeof(value));
		if (typeof(IClass) == "function" && !(isStrict ? value.constructor == IClass : value instanceof IClass)) throw new Error("instanceof value is not: " + IClass.name + "; actual: " + value.constructor.name);
		return value;
	};
}

// STATIC MEMBERS
klass.verifyNumber = getTypeVerifier("number", Number);	//NOTE: replaces #getDouble(), #getInt(), and #getLong()
klass.verifyString = getTypeVerifier("string", String);
klass.verifyDocument = getTypeVerifier("object", Object, true);	//TODO: change to verifyObject? since we're not using actual Document instances
klass.verifyArray = getTypeVerifier("object", Array, true);
klass.verifyDate = getTypeVerifier("object", Date, true);
klass.verifyRegExp = getTypeVerifier("object", RegExp, true);	//NOTE: renamed from #getRegex()
//TODO:	klass.verifyOid = ...?
//TODO:	klass.VerifyTimestamp = ...?
klass.verifyBool = getTypeVerifier("boolean", Boolean, true);

klass.coerceToBool = function coerceToBool(value) {
	if (typeof(value) == "string") return true;
	return !!value;	// including null or undefined
};
klass.coerceToInt =
klass.coerceToLong =
klass.coerceToDouble =
klass._coerceToNumber = function _coerceToNumber(value) { //NOTE: replaces .coerceToInt(), .coerceToLong(), and .coerceToDouble()
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
klass.coerceToDate = function coerceToDate(value) {
	//TODO: Support Timestamp BSON type?
	if (value instanceof Date) return value;
	throw new Error("can't convert from BSON type " + typeof(value) + " to Date; uassert code 16006");
};
//TODO: klass.coerceToTimeT = ...?   try to use as Date first rather than having coerceToDate return Date.parse  or dateObj.getTime() or similar
//TODO:	klass.coerceToTm = ...?
klass.coerceToString = function coerceToString(value) {
	if (value === null) return "";
	switch (typeof(value)) {
	case "undefined":
		return "";
	case "number":
		return value.toString();
	case "string":
		return value;
	default:
		throw new Error("can't convert from BSON type " + typeof(value) + " to String; uassert code 16007");
	}
};
//TODO:	klass.coerceToTimestamp = ...?

/**
 * Compare two Values.
 *
 * @static
 * @method compare
 * @param rL left value
 * @param rR right value
 * @returns an integer less than zero, zero, or an integer greater than zero, depending on whether rL < rR, rL == rR, or rL > rR
 **/
var Document;  // loaded lazily below //TODO: a dirty hack; need to investigate and clean up
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
	if(l.constructor && l.constructor.name in {'MinKey':1,'MaxKey':1} ){
		if(l.constructor.name == r.constructor.name) { 
			return 0; 
		} else if (l.constructor.name === 'MinKey'){
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
		return klass.cmp(l,r);
	case "boolean":
		return l == r ? 0 : l ? 1 : -1;
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

//TODO:	klass.hashCombine = ...?
//TODO:	klass.getWidestNumeric = ...?
//TODO:	klass.getApproximateSize = ...?
//TODO:	klass.addRef = ...?
//TODO:	klass.release = ...?
