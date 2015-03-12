"use strict";

var AllElemMatchOp = require("./AllElemMatchOp"),
	AndMatchExpression = require("./AndMatchExpression"),
	AtomicMatchExpression = require("./AtomicMatchExpression"),
	ComparisonMatchExpression = require("./ComparisonMatchExpression"),
	ElemMatchObjectMatchExpression = require("./ElemMatchObjectMatchExpression"),
	ElemMatchValueMatchExpression = require("./ElemMatchValueMatchExpression"),
	EqualityMatchExpression = require("./EqualityMatchExpression"),
	ErrorCodes = require("../errors").ErrorCodes,
	ExistsMatchExpression = require("./ExistsMatchExpression"),
	FalseMatchExpression = require("./FalseMatchExpression"),
	InMatchExpression = require("./InMatchExpression"),
	MatchExpression = require("./MatchExpression"),
	ModMatchExpression = require("./ModMatchExpression"),
	NorMatchExpression = require("./NorMatchExpression"),
	NotMatchExpression = require("./NotMatchExpression"),
	OrMatchExpression = require("./OrMatchExpression"),
	RegexMatchExpression = require("./RegexMatchExpression"),
	SizeMatchExpression = require("./SizeMatchExpression"),
	TextMatchExpressionParser = require("./TextMatchExpressionParser"),
	TypeMatchExpression = require("./TypeMatchExpression");

/**
 * Match Expression Parser
 * @class MatchExpressionParser
 * @static
 * @namespace mungedb-aggregate.matcher
 * @module mungedb-aggregate
 * @constructor
 */
var MatchExpressionParser = module.exports = function MatchExpressionParser() {
}, klass = MatchExpressionParser, proto = klass.prototype; //jshint ignore:line

proto.expressionParserTextCallback = TextMatchExpressionParser.expressionParserTextCallbackReal;

// The maximum allowed depth of a query tree. Just to guard against stack overflow.
var MAXIMUM_TREE_DEPTH = 100;

/**
 * Check if the input element is an expression
 * @method _isExpressionDocument
 * @param element
 */
proto._isExpressionDocument = function _isExpressionDocument(element, allowIncompleteDBRef) {
	if (!(element instanceof Object))
		return false;

	if (Object.keys(element).length === 0)
		return false;

	var name = Object.keys(element)[0];
	if (name[0] !== "$")
		return false;

	if (this._isDBRefDocument(element, allowIncompleteDBRef))
		return false;

	return true;
};

proto._isDBRefDocument = function _isDBRefDocument(obj, allowIncompleteDBRef) {
	var hasRef, hasID, hasDB = false;

	var i, fieldName, element = null,
		keys = Object.keys(obj), length = keys.length;
	for (i = 0; i < length; i++) {
		fieldName = keys[i];
		element = obj[fieldName];
		if (!hasRef && fieldName === "$ref")
			hasRef = true;
		else if (!hasID && fieldName === "$id")
			hasID = true;
		else if (!hasDB && fieldName === "$db")
			hasDB = true;
	}

	return allowIncompleteDBRef && (hasRef || hasID || hasDB) || (hasRef && hasID);
};

/**
 * Parse the input object into individual elements
 * @method _parse
 * @param obj
 * @param level
 */
proto._parse = function _parse(obj, level) { //jshint maxstatements:53, maxcomplexity:27
	if (level > MAXIMUM_TREE_DEPTH)
		return {code:ErrorCodes.BAD_VALUE, description:"exceeded maximum query tree depth of " +
			MAXIMUM_TREE_DEPTH + " at " + JSON.stringify(obj)};

	var rest, temp, status, element, eq;
	var root = new AndMatchExpression();
	var objkeys = Object.keys(obj);
	var currname, currval;
	var topLevel = level === 0;
	level++;
	for (var i = 0; i < objkeys.length; i++) {
		currname = objkeys[i];
		currval = obj[currname];
		if (currname[0] === "$") {
			rest = currname.substr(1);

			// TODO: optimize if block?
			if ("or" === rest) {
				if (!(currval instanceof Array))
					return {code:ErrorCodes.BAD_VALUE, description:"$or needs an array"};
				temp = new OrMatchExpression();
				status = this._parseTreeList(currval, temp, level);
				if (status.code !== ErrorCodes.OK)
					return status;
				root.add(temp);
			}
			else if ("and" === rest) {
				if (!(currval instanceof Array))
					return {code:ErrorCodes.BAD_VALUE, description:"and needs an array"};
				temp = new AndMatchExpression();
				status = this._parseTreeList(currval, temp, level);
				if (status.code !== ErrorCodes.OK)
					return status;
				root.add(temp);
			}
			else if ("nor" === rest) {
				if (!(currval instanceof Array))
					return {code:ErrorCodes.BAD_VALUE, description:"and needs an array"};
				temp = new NorMatchExpression();
				status = this._parseTreeList(currval, temp, level);
				if (status.code !== ErrorCodes.OK)
					return status;
				root.add(temp);
			}
			else if (("atomic" === rest) || ("isolated" === rest)) {
				if (!topLevel)
					return {code:ErrorCodes.BAD_VALUE, description:"$atomic/$isolated has to be at the top level"};
				if (element)
					root.add(new AtomicMatchExpression());
			}
			else if ("where" === rest) {
				/*
				if ( !topLevel )
					return StatusWithMatchExpression( ErrorCodes::BAD_VALUE, "$where has to be at the top level" );
				*/

				return {"code":"FAILED_TO_PARSE", "desc":"Where unimplimented."};
				/*
				status = this.expressionParserWhereCallback(element);
				if (status.code !== ErrorCodes.OK)
					return status;
				root.add(status.result);*/
			} else if ("text" === rest) {
				if (typeof currval !== "object") {
					return {code: ErrorCodes.BAD_VALUE, description: "$text expects an object"};
				}

				return this.expressionTextCallback(currval);
			}
			else if ("comment" === rest) {
				true /*noop*/; //jshint ignore:line
			}
			else {
				return {code:ErrorCodes.BAD_VALUE, description:"unknown top level operator: " + currname};
			}

			continue;
		}

		if (this._isExpressionDocument(currval)) {
			status = this._parseSub(currname, currval, root, level);
			if (status.code !== ErrorCodes.OK)
				return status;
			continue;
		}

		if (currval instanceof RegExp) {
			status = this._parseRegexElement(currname, currval);
			if (status.code !== ErrorCodes.OK)
				return status;
			root.add(status.result);
			continue;
		}

		eq = new EqualityMatchExpression();
		status = eq.init(currname, currval);
		if (status.code !== ErrorCodes.OK)
			return status;

		root.add(eq);
	}

	if (root.numChildren() === 1) {
		return {code:ErrorCodes.OK, result:root.getChild(0)};
	}

	return {code:ErrorCodes.OK, result:root};
};

/**
 * Parse the $all element
 * @method _parseAll
 * @param name
 * @param element
 */
proto._parseAll = function _parseAll(name, element, level) { //jshint maxcomplexity:14
	var status, i;

	if (!(element instanceof Array))
		return {code:ErrorCodes.BAD_VALUE, description:"$all needs an array"};

	var arr = element;
	if ((arr[0] instanceof Object) && ("$elemMatch" === Object.keys(arr[0])[0])) {
		// $all : [ { $elemMatch : {} } ... ]

		var temp = new AllElemMatchOp();
		status = temp.init(name);
		if (status.code !== ErrorCodes.OK)
			return status;

		for (i = 0; i < arr.length; i++) {
			var hopefullyElemMatchElement = arr[i];

			if (!(hopefullyElemMatchElement instanceof Object)) {
				// $all : [ { $elemMatch : ... }, 5 ]
				return {code:ErrorCodes.BAD_VALUE, description:"$all/$elemMatch has to be consistent"};
			}

			if ("$elemMatch" !== Object.keys(hopefullyElemMatchElement)[0]) {
				// $all : [ { $elemMatch : ... }, { x : 5 } ]
				return {code:ErrorCodes.BAD_VALUE, description:"$all/$elemMatch has to be consistent"};
			}

			status = this._parseElemMatch("", hopefullyElemMatchElement.$elemMatch, level);
			if (status.code !== ErrorCodes.OK)
				return status;
			temp.add(status.result);
		}

		return {code:ErrorCodes.OK, result:temp};
	}

	var myAnd = new AndMatchExpression();
	for (i = 0; i < arr.length; i++) {
		var e = arr[i];

		if (e instanceof RegExp) {
			var r = new RegexMatchExpression();
			status = r.init(name, e);
			if (status.code !== ErrorCodes.OK)
				return status;
			myAnd.add(r);
		}
		else if ((e instanceof Object) && (typeof(Object.keys(e)[0] === "string" && Object.keys(e)[0][0] === "$" ))) {
			return {code:ErrorCodes.BAD_VALUE, description:"no $ expressions in $all"};
		}
		else {
			var x = new EqualityMatchExpression();
			status = x.init(name, e);
			if (status.code !== ErrorCodes.OK)
				return status;
			myAnd.add(x);
		}
	}

	if (myAnd.numChildren() === 0) {
		return {code:ErrorCodes.OK, result:new FalseMatchExpression()};
	}

	return {code:ErrorCodes.OK, result:myAnd};
};

/**
 * Parse the input array and add new RegexMatchExpressions to entries
 * @method _parseArrayFilterEntries
 * @param entries
 * @param theArray
 */
proto._parseArrayFilterEntries = function _parseArrayFilterEntries(entries, theArray) {
	var status, e, r;
	for (var i = 0; i < theArray.length; i++) {
		e = theArray[i];

		if (this._isExpressionDocument(e, false)) {
			return {code:ErrorCodes.BAD_VALUE, description:"cannot nest $ under $in"};
		}

		if (e instanceof RegExp ) {
			r = new RegexMatchExpression();
			status = r.init("", e);
			if (status.code !== ErrorCodes.OK)
				return status;
			status = entries.addRegex(r);
			if (status.code !== ErrorCodes.OK)
				return status;
		}
		else {
			status = entries.addEquality(e);
			if (status.code !== ErrorCodes.OK)
				return status;
		}
	}
	return {code:ErrorCodes.OK};
};

/**
 * Parse the input ComparisonMatchExpression
 * @method _parseComparison
 * @param name
 * @param cmp
 * @param element
 */
proto._parseComparison = function _parseComparison(name, cmp, element) {
	var temp = new ComparisonMatchExpression(cmp);

	var status = temp.init(name, element);
	if (status.code !== ErrorCodes.OK)
		return status;

	return {code:ErrorCodes.OK, result:temp};
};

/**
 * Parse an element match into the appropriate expression
 * @method _parseElemMatch
 * @param name
 * @param element
 */
proto._parseElemMatch = function _parseElemMatch(name, element, level) {
	var temp, status;
	if (!(element instanceof Object))
		return {code:ErrorCodes.BAD_VALUE, description:"$elemMatch needs an Object"};

	// $elemMatch value case applies when the children all
	// work on the field 'name'.
	// This is the case when:
	//     1) the argument is an expression document; and
	//     2) expression is not a AND/NOR/OR logical operator. Children of
	//        these logical operators are initialized with field names.
	//     3) expression is not a WHERE operator. WHERE works on objects instead
	//        of specific field.
	var elt = element[Object.keys(element)[0]],
		isElemMatchValue = this._isExpressionDocument(element, true) &&
			elt !== "$and" &&
			elt !== "$nor" &&
			elt !== "$or" &&
			elt !== "$where";

	if (isElemMatchValue) {
		// value case

		var theAnd = new AndMatchExpression();
		status = this._parseSub("", element, theAnd, level);
		if (status.code !== ErrorCodes.OK)
			return status;

		temp = new ElemMatchValueMatchExpression();
		status = temp.init(name);
		if (status.code !== ErrorCodes.OK)
			return status;

		for (var i = 0; i < theAnd.numChildren(); i++ ) {
			temp.add(theAnd.getChild(i));
		}
		theAnd.clearAndRelease();

		return {code:ErrorCodes.OK, result:temp};
	}

	// DBRef value case
	// A DBRef document under a $elemMatch should be treated as an object case
	// because it may contain non-DBRef fields in addition to $ref, $id and $db.

	// object case

	status = this._parse(element, level);
	if (status.code !== ErrorCodes.OK)
		return status;

	temp = new ElemMatchObjectMatchExpression();
	status = temp.init(name, status.result);
	if (status.code !== ErrorCodes.OK)
		return status;

	return {code:ErrorCodes.OK, result:temp};
};

/**
 * Parse a ModMatchExpression
 * @method _parseMOD
 * @param name
 * @param element
 */
proto._parseMOD = function _parseMOD(name, element) {
	var d,r;
	if (!(element instanceof Array))
		return {code:ErrorCodes.BAD_VALUE, result:"malformed mod, needs to be an array"};
	if (element.length < 2)
		return {code:ErrorCodes.BAD_VALUE, result:"malformed mod, not enough elements"};
	if (element.length > 2)
		return {code:ErrorCodes.BAD_VALUE, result:"malformed mod, too many elements"};
	if (typeof element[0] !== "number") {
		return {code:ErrorCodes.BAD_VALUE, result:"malformed mod, divisor not a number"};
	} else {
		d = element[0];
	}
	if (typeof element[1] !== "number") {
		return {code:ErrorCodes.BAD_VALUE, result:"malformed mod, remainder not a number"};
	} else {
		r = element[1];
	}

	var temp = new ModMatchExpression();
	var status = temp.init( name, d, r);
	if (status.code !== ErrorCodes.OK)
		return status;

	return {code:ErrorCodes.OK, result:temp};
};

/**
 * Parse a NotMatchExpression
 * @method _parseNot
 * @param name
 * @param element
 */
proto._parseNot = function _parseNot(name, element, level) {
	var status;
	if (element instanceof RegExp) {
		status = this._parseRegexElement(name, element);
		if (status.code !== ErrorCodes.OK)
			return status;
		var n = new NotMatchExpression();
		status = n.init(status.result);
		if (status.code !== ErrorCodes.OK)
			return status;
		return {code:ErrorCodes.OK, result:n};
	}

	if (!(element instanceof Object))
		return {code:ErrorCodes.BAD_VALUE, result:"$not needs a regex or a document"};

	if (element === {})
		return {code:ErrorCodes.BAD_VALUE, result:"$not cannot be empty"};

	var theAnd = new AndMatchExpression();
	status = this._parseSub(name, element, theAnd, level);
	if (status.code !== ErrorCodes.OK)
		return status;

	// TODO: this seems arbitrary?
	// tested in jstests/not2.js
	for (var i = 0; i < theAnd.numChildren(); i++) {
		if (theAnd.getChild(i).matchType === MatchExpression.REGEX) {
			return {code:ErrorCodes.BAD_VALUE, result:"$not cannot have a regex"};
		}
	}
	var theNot = new NotMatchExpression();
	status = theNot.init(theAnd);
	if (status.code !== ErrorCodes.OK)
		return status;

	return {code:ErrorCodes.OK, result:theNot};
};

/**
 * Parse a RegexMatchExpression
 * @method _parseRegexDocument
 * @param name
 * @param doc
 */
proto._parseRegexDocument = function _parseRegexDocument(name, doc) {
	var regex = "", regexOptions = "", e;

	if(doc.$regex) {
		e = doc.$regex;
		if(e instanceof RegExp) {
			var str = e.toString(),
				flagIndex = 0;
			for (var c = str.length; c > 0; c--) {
				if (str[c] === "/") {
					flagIndex = c;
					break;
				}
			}
			regex = (flagIndex? str : str.substr(1, flagIndex-1));
			regexOptions = str.substr(flagIndex, str.length);
		} else if (typeof e  === "string") {
			regex = e;
		} else {
			return {code:ErrorCodes.BAD_VALUE, description:"$regex has to be a string"};
		}
	}

	if(doc.$options) {
		e = doc.$options;
		if (typeof(e) === "string") {
			regexOptions = e;
		} else {
			return {code:ErrorCodes.BAD_VALUE, description:"$options has to be a string"};
		}

	}

	var temp = new RegexMatchExpression();
	var status = temp.init(name, regex, regexOptions);
	if (status.code !== ErrorCodes.OK)
		return status;

	return {code:ErrorCodes.OK, result:temp};
};

/**
 * Parse an element into a RegexMatchExpression
 * @method _parseRegexElement
 * @param name
 * @param element
 */
proto._parseRegexElement = function _parseRegexElement(name, element) {
	if (!(element instanceof RegExp))
		return {code:ErrorCodes.BAD_VALUE, description:"not a regex"};

	var str = element.toString(),
		flagIndex = 0;
	for (var c = str.length; c > 0; c--) {
		if (str[c] === "/") {
			flagIndex = c;
			break;
		}
	}
	var regex = str.substr(1, flagIndex-1),
		regexOptions = str.substr(flagIndex+1, str.length),
		temp = new RegexMatchExpression(),
		status = temp.init(name, regex, regexOptions);

	if (status.code !== ErrorCodes.OK)
		return status;

	return {code:ErrorCodes.OK, result:temp};
};

/**
 * Parse a sub expression
 * @method _parseSub
 * @param name
 * @param sub
 * @param root
 */
proto._parseSub = function _parseSub(name, sub, root, level) {
	var subkeys = Object.keys(sub),
		currname, currval;

	if (level > MAXIMUM_TREE_DEPTH) {
		return {code:ErrorCodes.BAD_VALUE, description:"exceeded maximum query tree depth of " +
			MAXIMUM_TREE_DEPTH + " at " + JSON.stringify(sub)};
	}

	level++;

	// DERIVATION: We are not implementing Geo functions yet.

	for (var i = 0; i < subkeys.length; i++) {
		currname = subkeys[i];
		currval = sub[currname];
		var deep = {};
		deep[currname] = currval;

		var status = this._parseSubField(sub, root, name, deep, level);
		if (status.code !== ErrorCodes.OK)
			return status;

		if (status.result)
			root.add(status.result);
	}

	return {code:ErrorCodes.OK, result:root};
};

/**
 * Parse a sub expression field
 * @method _parseSubField
 * @param context
 * @param andSoFar
 * @param name
 * @param element
 */
proto._parseSubField = function _parseSubField(context, andSoFar, name, element, level) { //jshint maxcomplexity:45
	// TODO: these should move to getGtLtOp, or its replacement
	var currname = Object.keys(element)[0];
	var currval = element[currname];
	if ("$eq" === currname)
		return this._parseComparison(name, "EQ", currval);

	if ("$not" === currname)
		return this._parseNot(name, currval, level);

	var status, temp, temp2;
	switch (currname) {
		// TODO: -1 is apparently a value for mongo, but we handle strings so...
	case "$lt":
		return this._parseComparison(name, "LT", currval);
	case "$lte":
		return this._parseComparison(name, "LTE", currval);
	case "$gt":
		return this._parseComparison(name, "GT", currval);
	case "$gte":
		return this._parseComparison(name, "GTE", currval);
	case "$ne":
		// Just because $ne can be rewritten as the negation of an
		// equality does not mean that $ne of a regex is allowed. See SERVER-1705.
		if (currval instanceof RegExp) {
			return {code:ErrorCodes.BAD_VALUE, description:"Can't have regex as arg to $ne."};
		}
		status = this._parseComparison(name, "EQ", currval);
		if (status.code !== ErrorCodes.OK)
			return status;
		var n = new NotMatchExpression();
		status = n.init(status.result);
		if (status.code !== ErrorCodes.OK)
			return status;
		return {code:ErrorCodes.OK, result:n};
	case "$eq":
		return this._parseComparison(name, "EQ", currval);

	case "$in":
		if (!(currval instanceof Array))
			return {code:ErrorCodes.BAD_VALUE, description:"$in needs an array"};
		temp = new InMatchExpression();
		status = temp.init(name);
		if (status.code !== ErrorCodes.OK)
			return status;
		status = this._parseArrayFilterEntries(temp.getArrayFilterEntries(), currval);
		if (status.code !== ErrorCodes.OK)
			return status;
		return {code:ErrorCodes.OK, result:temp};

	case "$nin":
		if (!(currval instanceof Array))
			return {code:ErrorCodes.BAD_VALUE, description:"$nin needs an array"};
		temp = new InMatchExpression();
		status = temp.init(name);
		if (status.code !== ErrorCodes.OK)
			return status;
		status = this._parseArrayFilterEntries(temp.getArrayFilterEntries(), currval);
		if (status.code !== ErrorCodes.OK)
			return status;

		temp2 = new NotMatchExpression();
		status = temp2.init(temp);
		if (status.code !== ErrorCodes.OK)
			return status;

		return {code:ErrorCodes.OK, result:temp2};

	case "$size":
		var size = 0;
		if ( typeof(currval) === "string")
			// matching old odd semantics
			size = 0;
		else if (typeof(currval) === "number")
			// SERVER-11952. Setting "size" to -1 means that no documents
			// should match this $size expression.
			if (currval < 0)
				size = -1;
			else
				size = currval;
		else {
			return {code:ErrorCodes.BAD_VALUE, description:"$size needs a number"};
		}

		// DERIVATION/Potential bug: Mongo checks to see if doube values are exactly equal to
		// their int converted version. If not, size = -1.

		temp = new SizeMatchExpression();
		status = temp.init(name, size);
		if (status.code !== ErrorCodes.OK)
			return status;

		return {code:ErrorCodes.OK, result:temp};

	case "$exists":
		if (currval === {})
			return {code:ErrorCodes.BAD_VALUE, description:"$exists can't be eoo"};
		temp = new ExistsMatchExpression();
		status = temp.init(name);
		if (status.code !== ErrorCodes.OK)
			return status;
		if (currval) // DERIVATION: This may have to check better than truthy? Need to look at TrueValue
			return {code:ErrorCodes.OK, result:temp};
		temp2 = new NotMatchExpression();
		status = temp2.init(temp);
		if (status.code !== ErrorCodes.OK)
			return status;
		return {code:ErrorCodes.OK, result:temp2};

	case "$type":
		if (typeof(currval) !== "number")
			return {code:ErrorCodes.BAD_VALUE, description:"$type has to be a number"};
		var type = currval;
		temp = new TypeMatchExpression();
		status = temp.init(name, type);
		if (status.code !== ErrorCodes.OK)
			return status;
		return {code:ErrorCodes.OK, result:temp};

	case "$mod":
		return this._parseMOD(name, currval);

	case "$options":
		// TODO: try to optimize this
		// we have to do this since $options can be before or after a $regex
		// but we validate here
		for(var i = 0; i < Object.keys(context).length; i++) {
			temp = Object.keys(context)[i];
			if (temp === "$regex")
				return {code:ErrorCodes.OK, result:null};
		}

		return {code:ErrorCodes.BAD_VALUE, description:"$options needs a $regex"};

	case "$regex":
		return this._parseRegexDocument(name, context);

	case "$elemMatch":
		return this._parseElemMatch(name, currval, level);

	case "$all":
		return this._parseAll(name, currval, level);

	case "$geoWithin":
	case "$geoIntersects":
	case "$near":
	case "$nearSphere":
		var x = "Temporary value until Geo fns implimented.";
		return this.expressionParserGeoCallback(name, x, context);
	default:
		return {code:ErrorCodes.BAD_VALUE, description:"not handled: " + JSON.stringify(element)};
	} // end switch


	return {code:ErrorCodes.BAD_VALUE, description:"not handled: " + JSON.stringify(element)};
};

/**
 * Parse a list of parsable elements
 * @method _parseTreeList
 * @param arr
 * @param out
 */
proto._parseTreeList = function _parseTreeList(arr, out, level) {
	if (arr.length === 0)
		return {code:ErrorCodes.BAD_VALUE, description:"$and/$or/$nor must be a nonempty array"};

	var status, element;
	for (var i = 0; i < arr.length; i++) {
		element = arr[i];

		if (!(element instanceof Object))
			return {code:ErrorCodes.BAD_VALUE, description:"$or/$and/$nor entries need to be full objects"};

		status = this._parse(element, level);
		if (status.code !== ErrorCodes.OK)
			return status;

		out.add(status.result);
	}
	return {code:ErrorCodes.OK};
};

/**
 * Wrapper for _parse
 * @method parse
 * @param obj
 */
proto.parse = function parse(obj) {
	return this._parse(obj, 0);
};
