"use strict";

/**
 * A set of values (i.e., `typedef unordered_set<Value, Value::Hash> ValueSet;`)
 * @class ValueSet
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var ValueSet = module.exports = function ValueSet(vals) {
	this.set = {};
	if (vals instanceof Array)
		this.insertRange(vals);
}, klass = ValueSet, proto = klass.prototype;

proto._getKey = JSON.stringify;

proto.hasKey = function hasKey(key) {
	return key in this.set;
};
//SKIPPED: proto.count -- use hasKey instead

proto.has = function has(val) {
	return this._getKey(val) in this.set;
};

proto.insert = function insert(val) {
	var valKey = this._getKey(val);
	if (!this.hasKey(valKey)) {
		this.set[valKey] = val;
		return valKey;
	}
	return undefined;
};

proto.insertRange = function insertRange(vals) {
	var results = [];
	for (var i = 0, l = vals.length; i < l; i++)
		results.push(this.insert(vals[i]));
	return results;
};

proto.equals = function equals(other) {
	for (var key in this.set) { //jshint ignore:line
		if (!other.hasKey(key))
			return false;
	}
	for (var otherKey in other.set) { //jshint ignore:line
		if (!this.hasKey(otherKey))
			return false;
	}
	return true;
};

proto.values = function values() {
	var vals = [];
	for (var key in this.set) //jshint ignore:line
		vals.push(this.set[key]);
	return vals;
};

proto.size = function values() {
	var n = 0;
	for (var key in this.set) //jshint ignore:line
		n++;
	return n;
};

proto.swap = function swap(other) {
	var tmp = this.set;
	this.set = other.set;
	other.set = tmp;
};

proto.eraseKey = function eraseKey(key) {
	delete this.set[key];
};

proto.erase = function erase(val) {
	var key = this._getKey(val);
	this.eraseKey(key);
};

proto.empty = function empty() {
	for (var key in this.set) //jshint ignore:line
		return false;
	return true;
};
