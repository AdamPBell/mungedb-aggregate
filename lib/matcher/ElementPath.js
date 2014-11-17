"use strict";

var FieldRef = require("./FieldRef"),
	ErrorCodes = require("../errors").ErrorCodes;

var ElementPath = module.exports = function ElementPath(){
	this._fieldRef = new FieldRef();
	this._shouldTraverseLeafArray = false;
}, klass = ElementPath, proto = klass.prototype;

proto._fieldRef = undefined;

proto._shouldTraverseLeafArray = undefined;

/**
 * getFieldDottedOrArray
 *
 * @method getFieldDottedArray
 * @param doc
 * @param path
 * @param idxPathObj This is an object with a pathID element. This allows for pass by ref in calling function.
 * */
klass.getFieldDottedOrArray = function getFieldDottedOrArray(doc, path, idxPathObj){
	if (path.numParts() === 0 ) { return doc; }

	var res,curr = doc,
		stop = false,
		partNum = 0;
	while (partNum < path.numParts() && !stop) {
		res = curr[path.getPart( partNum)];
		if(res instanceof Object && Object.keys(res).length === 0){
			stop = true;
		} else if (res instanceof Object) {
			curr = res;
			partNum++;
		} else if (res instanceof Array) {
			stop = true;
		} else {
			if (partNum + 1 < path.numParts() ) {
				res = {};
			}
			stop = true;
		}

	}

	idxPathObj.pathID = partNum;
	return res;
};

/**
 * isAllDigits does what it says on the tin.
 *
 * @method isAllDigits
 * @param str
 */

klass.isAllDigits = function isAllDigits ( str ){
	var digitCheck = /\D/g;
	if (digitCheck.exec(str) === null){ return true; }
	return false;
};





/**
 *
 * return the internal fieldRef object
 * @method fieldRef
 * @param
 *
 */
proto.fieldRef = function fieldRef(){
	return this._fieldRef;
};


/**
 *
 * Initialize necessary items on this instance
 * @method init
 * @param path
 *
 */
proto.init = function init( path ){
	this._shouldTraverseLeafArray = true;
	this._fieldRef.parse( path );
	return {"code":ErrorCodes.OK};
};


/**
 *
 * Set whether paths should traverse leaves inside arrays
 * @method setTraverseLeafArray
 * @param
 *
 */
proto.setTraverseLeafArray = function setTraverseLeafArray( b ){
	this._shouldTraverseLeafArray = b;
};


/**
 *
 * Return whether arrays should traverse leaf arrays
 * @method shouldTraverseLeafArray
 * @param
 *
 */
proto.shouldTraverseLeafArray = function shouldTraverseLeafArray( ){
	return this._shouldTraverseLeafArray;
};


proto.objAtPath = function objAtPath(doc) {
	return klass.objAtPath(doc, this._fieldRef._path);
};

klass.objAtPath = function objAtPath(doc, path) {
	if (path.length === 0) {
		return doc;
	}
	if (path.length > 0 && Object.keys(doc).length === 0) {
		return {};
	}
	if (doc === null || doc === undefined) {
		return doc;
	}
	var tpath = path.split(".");
	return klass.objAtPath(doc[tpath[0]], tpath.slice(1).join("."));
};


/**
 *
 * Helper to wrap our path into the static method
 * @method _matches
 * @param doc
 * @param details
 * @param function checker this function is used to check for a valid item at the end of the path
 *
 */
proto._matches = function _matches(doc, details, checker) {
	return klass._matches(doc, this._fieldRef._array, this._shouldTraverseLeafArray, details, checker);
};

/**
 *
 * _matches exists because we don't have pathIterators, so we need a recursive function call
 * through the path pieces
 * @method _matches
 * @param doc
 * @param path
 * @param details
 * @param function checker this function is used to check for a valid item at the end of the path
 *
 */
klass._matches = function _matches(doc, path, shouldTraverseLeafArray, details, checker) { //jshint maxcomplexity:22
	var k, result, ii, il,
		curr = doc,
		item = doc;
	for (k = 0; k < path.length; k++) {
		if ((curr instanceof Object) && (path[k] in curr)) {
			item = curr[path[k]];
		}
		if (path[k].length === 0)
			continue;
		item = curr[path[k]];
		if (item instanceof Object && item.constructor === Object) {
			if (!(isNaN(parseInt(path[k], 10)))) {
				result = checker(item[path[k]]);
				if (result) {
					if (details && details.needRecord())
						details.setElemMatchKey(ii.toString());
					return result;
				}
			}
			curr = item;
			continue;
		} else if (item instanceof Object && item.constructor === Array) {
			if (k === path.length - 1) {
				if ((shouldTraverseLeafArray) && (isNaN(parseInt(path[k], 10)))) {
					for (ii = 0, il = item.length; ii < il; ii++) {
						result = checker(item[ii]);
						if (result) {
							if (details && details.needRecord())
								details.setElemMatchKey(ii.toString());
							return result;
						}
					}
					if (item.length === 0)
						return checker({});

				}
				curr = item;
				break; // this is the end of the path, so check this array
			} else if (!(isNaN(parseInt(path[k + 1], 10)))) {
				curr = item;
				continue; // the *next* path section is an item in the array so we don't check this whole array
			}
			// otherwise, check each item in the array against the rest of the path
			for (ii = 0, il = item.length; ii < il; ii++) {
				var subitem = item[ii];
				if (!subitem || subitem.constructor !== Object) continue;	// can't look for a subfield in a non-object value.
				if (this._matches(subitem, path.slice(k), shouldTraverseLeafArray, null, checker)) { // check against the rest of the path
					if (details && details.needRecord())
						details.setElemMatchKey(ii.toString());
					return true;
				}
			}
			return false; // checked all items in the array and found no matches
		} else {

			if ( details === undefined && item !== null && curr[path[k+1]] !== undefined) {
				curr = curr[path[k+1]];
			}
		}
	}
	return checker(item);
};
