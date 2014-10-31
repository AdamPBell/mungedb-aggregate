"use strict";

/**
 * MatchDetails
 * @class MatchDetails
 * @namespace mungedb-aggregate.pipeline.matcher
 * @module mungedb-aggregate
 * @constructor
 **/
var MatchDetails = module.exports = function (){
	this._elemMatchKeyRequested = false;
	this.resetOutput();
}, klass = MatchDetails, base =  Object  , proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

proto._elemMatchKey = undefined;

proto._elemMatchKeyRequested = undefined;

proto._loadedRecord = undefined;

/**
 *
 * Set _loadedRecord to false and _elemMatchKey to undefined
 * @method resetOutput
 *
 */
proto.resetOutput = function resetOutput(){
	this._loadedRecord = false;
	this._elemMatchKey = undefined;
};

/**
 *
 * Return a string representation of ourselves
 * @method toString
 *
 */
proto.toString = function toString(){
	return "loadedRecord: " + this._loadedRecord + " " + "elemMatchKeyRequested: " + this._elemMatchKeyRequested + " " + "elemMatchKey: " + ( this._elemMatchKey ? this._elemMatchKey : "NONE" ) + " ";
};

/**
 *
 * Set the _loadedRecord property
 * @method setLoadedRecord
 * @param loadedRecord
 *
 */
proto.setLoadedRecord = function setLoadedRecord(loadedRecord){
	this._loadedRecord = loadedRecord;
};

/**
 *
 * Return the _loadedRecord property
 * @method hasLoadedRecord
 *
 */
proto.hasLoadedRecord = function hasLoadedRecord(){
	return this._loadedRecord;
};

/**
 *
 * Return the _elemMatchKeyRequested property
 * @method needRecord
 *
 */
proto.needRecord = function needRecord(){
	return this._elemMatchKeyRequested;
};

/**
 *
 * Set the _elemMatchKeyRequested property to true
 * @method requestElemMatchKey
 *
 */
proto.requestElemMatchKey = function requestElemMatchKey(){
	this._elemMatchKeyRequested = true;
};

/**
 *
 * Return the _elemMatchKey property so we can check if exists
 * @method hasElemMatchKey
 *
 */
proto.hasElemMatchKey = function hasElemMatchKey(){
	return (typeof this._elemMatchKey !== 'undefined');
};

/**
 *
 * Return the _elemMatchKey property
 * @method elemMatchKey
 *
 */
proto.elemMatchKey = function elemMatchKey(){
	if (!this.hasElemMatchKey()) throw new Error("no elem match key MatchDetails:29");
	return this._elemMatchKey;
};

/**
 *
 * If we request an _elemMatchKey then set it to the input
 * @method setElemMatchKey
 * @param elemMatchKey
 *
 */
proto.setElemMatchKey = function setElemMatchKey(elemMatchKey){
	if ( this._elemMatchKeyRequested ) {
		this._elemMatchKey = elemMatchKey;
	}
};
