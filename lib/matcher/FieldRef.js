"use strict";

var FieldRef = module.exports = function FieldRef (){
	this._array = [];
	this._path = "";
}, klass = FieldRef, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});


proto.parse = function parse( str ) {
	this._array = str.split(".");
	this._path = this._array.join(".");
};

proto.setPart = function setPart( i, part ) {
	this._array[i] = part;
	this._path = this._array.join(".");
};

proto.getPart = function getPArt( i ) {
	return this._array[i];
};


proto.isPrefixOf = function isPrefixOf( other ) {
	return ( other._path.indexOf(this.path) === 0 );
};

proto.commonPrefixSize = function commonPrefixSize ( other ) {
	var i = 0;
	while(other._array[i] === this._array[i]) { i++; }
	return i;
};

proto.dottedField = function dottedField( ) {
	var offset = 0;
	if(arguments.length === 1){
		offset = arguments[0];
	}
	return this._array.slice( offset ).join(".");
};

proto.equalsDottedField = function equalsDottedField ( other ) {
	return this._path === other._path;
};

proto.compare = function compare( other ) {
	return (this._path < other._path ? -1 : this._path > other._path ? 1 : 0);
};

proto.clear = function clear() {
	this._path = "";
	this._array = [];
};

proto.numParts = function numParts() {
	return this._array.length;
};

proto.numReplaced = function numReplaced() {
	throw new Error("Why?");
};
