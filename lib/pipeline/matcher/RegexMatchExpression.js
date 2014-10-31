"use strict";
var LeafMatchExpression = require('./LeafMatchExpression'),
	ErrorCodes = require('../../Errors').ErrorCodes;


var RegexMatchExpression = module.exports = function RegexMatchExpression(){
	base.call(this, 'REGEX');
}, klass = RegexMatchExpression, base =  LeafMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.MaxPatternSize = 32764;

proto._flags = undefined;
proto._re = undefined;
proto._regex = undefined;

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString(level) {
	var debug = this._debugAddSpace( level );
	debug += this.path() + " regex /" + this._regex + "/" + this._flags;

	var td = this.getTag();
	if (td === null) {
		debug += " " + td.debugString();
	}
	debug += "\n";
	return debug;
};

proto.shortDebugString = function shortDebugString() {
	return "/" + this._regex + "/" + this._flags;
};

/**
 *
 * checks if this expression is == to the other
 * @method equivalent
 * @param other
 *
 */
proto.equivalent = function equivalent(other) {
	if (this.matchType() !== other.matchType()) return false;
	
	return this.path() === other.path() && this._regex === other._regex && this._flags === other._flags;
};

/**
 *
 * Return the _flags property
 * @method getFlags
 *
 */
proto.getFlags = function getFlags(){
	return this._flags;
};

/**
 *
 * Return the _regex property
 * @method getString
 * @param
 *
 */
proto.getString = function getString(){
	return this._regex;
};

/**
 *
 * Initialize the necessary items
 * @method init
 * @param path
 * @param type
 *
 */
proto.init = function init(path,regex,flags) {
	if(regex.toString().length > klass.MaxPatternSize){
		return {'code':ErrorCodes.BAD_VALUE, 'desc':'Regular Expression too long.'};
	}

	if (regex instanceof RegExp){
		this._regex = regex.source;
		this._re = regex;
	} else if (regex instanceof String && (!flags || flags instanceof String )) {
		this._regex = regex;
		this._re = new RegExp(regex,(flags || '').replace(/[^gim]/g, ''));
	} else {
		return {'code':ErrorCodes.BAD_VALUE, 'desc':'regex not a regex'};
	}
	
	this._flags = 
		(this._re.global ? 'g' : '') + 
		(this._re.ignoreCase ? 'i' : '') + 
		(this._re.multiline ? 'm' : '');

	return this.initPath( path );
};

/**
 *
 * Check if the input element matches
 * @method matchesSingleElement
 * @param e
 *
 */

proto.matchesSingleElement = function matchesSingleElement(e) {
	if(e instanceof RegExp){
		return e.toString() === this._re.toString();
	}
	if(e instanceof String){
		return this._re.test(e);
	}
	// No support for SYMBOLS currently
};

/**
 *
 * clone this instance to a new one
 * @method shallowClone
 *
 */
proto.shallowClone = function shallowClone(){
	var e = new RegexMatchExpression();
	e.init( this.path(), this._regex, this._flags );

	if ( this.getTag() ) {
		e.setTag(this.getTag().clone());
	}

	return e;
};
