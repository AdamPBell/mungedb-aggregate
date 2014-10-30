"use strict";

/** 
 * Class generates unused ids
 * @class VariablesParseState
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var Variables = require('./Variables'),
	VariablesIdGenerator = require('./VariablesIdGenerator');

var VariablesParseState = module.exports = function VariablesParseState(idGenerator){
	if(!idGenerator || idGenerator.constructor !== VariablesIdGenerator) {
		throw new Error("idGenerator is required and must be of type VariablesIdGenerator");
	}
	this._idGenerator = idGenerator;
	this._variables = {}; //Note: The c++ type was StringMap<Variables::Id>
}, klass = VariablesParseState, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

/**
 * Assigns a named variable a unique Id. This differs from all other variables, even
 * others with the same name.
 *
 * The special variables ROOT and CURRENT are always implicitly defined with CURRENT
 * equivalent to ROOT. If CURRENT is explicitly defined by a call to this function, it
 * breaks that equivalence.
 *
 * NOTE: Name validation is responsibility of caller.
 **/
proto.defineVariable = function generateId(name) {
	// caller should have validated before hand by using Variables::uassertValidNameForUserWrite
	if(name === 'ROOT') {
		throw new Error("mError 17275: Can't redefine ROOT");
	}
	var id = this._idGenerator.generateId();
	this._variables[name] = id;
	return id;
};

/**
 * Returns the current Id for a variable. uasserts if the variable isn't defined.
 * @method getVariable
 * @param name {String} The name of the variable
 **/
proto.getVariable = function getIdCount(name) {
	var found = this._variables[name];
	if(typeof found === 'number') return found;
	if(name !== "ROOT" && name !== "CURRENT") {
		throw new Error("uError 17276: Use of undefined variable " + name);
	}

	return Variables.ROOT_ID;
};

