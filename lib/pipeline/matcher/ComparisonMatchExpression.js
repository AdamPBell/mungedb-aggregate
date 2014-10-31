"use strict";
var LeafMatchExpression = require('./LeafMatchExpression.js');
var Value = require('../Value');

/**
 * ComparisonMatchExpression
 * @class ComparisonMatchExpression
 * @namespace mungedb-aggregate.pipeline.matcher
 * @module mungedb-aggregate
 * @constructor
 */
var ComparisonMatchExpression = module.exports = function ComparisonMatchExpression(type){
	base.call(this);
	this._matchType = type;
}, klass = ComparisonMatchExpression, base =  LeafMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});


proto._rhs = undefined;

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString(level) {
	var retStr = this._debugAddSpace(level) + this.path() + " ";
	switch (this._matchType) {
		case 'LT':
			retStr += '$lt';
			break;
		case 'LTE':
			retStr += '$lte';
			break;
		case 'EQ':
			retStr += '==';
			break;
		case 'GT':
			retStr += '$gt';
			break;
		case 'GTE':
			retStr += '$gte';
			break;
		default:
			retStr += "Unknown comparison!";
			break;
	}

	retStr += (this._rhs ? this._rhs.toString() : '?');
	if (this.getTag()) {
		retStr += this.getTag().debugString();
	}
	return retStr + '\n';
};

/**
 *
 * checks if this expression is == to the other
 * @method equivalent
 * @param other
 *
 */
proto.equivalent = function equivalent(other) {
	if (other._matchType != this._matchType)  return false;
	return this.path() === other.path() && Value.compare(this._rhs,other._rhs) === 0;
};

/**
 *
 * Return the _rhs property
 * @method getData
 *
 */
proto.getData = function getData() {
	return this._rhs;
};

/**
 *
 * Return the _rhs property
 * @method getRHS
 *
 */
proto.getRHS = function getRHS() {
	return this._rhs;
};

/**
 *
 * Initialize the necessary items
 * @method init
 * @param path
 * @param type
 *
 */
proto.init = function init(path,rhs) {
	this._rhs = rhs;
	if ((rhs instanceof Object && Object.keys(rhs).length === 0)) return {'code':'BAD_VALUE', 'description':'Need a real operand'};

	if (rhs === undefined) return {'code':'BAD_VALUE', 'desc':'Cannot compare to undefined'};
	if (!(this._matchType in {"LT":1, "LTE":1, "EQ":1, "GT":1, "GTE":1})) {
		return {'code':'BAD_VALUE', 'description':'Bad match type for ComparisonMatchExpression'};
	}
	return this.initPath(path);
};

/**
 *
 * Check if the input element matches
 * @method matchesSingleElement
 * @param e
 *
 */
proto.matchesSingleElement = function matchesSingleElement(e) {
	if (typeof(e) != typeof(this._rhs)) {
		if (this._rhs === null) {
			if (this._matchType in {'EQ':1, 'LTE':1, 'GTE':1}) {
				if (e === undefined || e === null || (e instanceof Object && Object.keys(e).length === 0)) {
					return true;
				}
			}
			return false;
		}
		if ((e === null || e === undefined) && (this._rhs ===null || this._rhs === undefined)) {
			return ["EQ","LTE","GTE"].indexOf(this._matchType) != -1;
		}

		if (this._rhs.constructor.name in {'MaxKey':1,'MinKey':1}) {
			return this._matchType != "EQ";
		}
		return false;
	}

	var x = Value.compare(e, this._rhs);

	switch(this._matchType) {
		case "LT":
			return x == -1;
		case "LTE":
			return x <= 0;
		case "EQ":
			return x === 0;
		case "GT":
			return x === 1;
		case "GTE":
			return x >= 0;
		default:
			throw new Error("Invalid comparison type evaluated.");
	}
	return false;
};
