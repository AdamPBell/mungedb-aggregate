"use strict";

var FieldRef = require('./FieldRef'),
	ErrorCodes = require('../../Errors.js').ErrorCodes;

var ElementPath = module.exports = function ElementPath(){
	this._fieldRef = new FieldRef();
	this._shouldTraverseLeafArray = false;
}, klass = ElementPath, base =  Object  , proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

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
	return {'code':ErrorCodes.OK};
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
