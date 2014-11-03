"use strict";

/**
 * This class represents the Variables that are defined in an Expression tree.
 *
 * All copies from a given instance share enough information to ensure unique Ids are assigned
 * and to propagate back to the original instance enough information to correctly construct a
 * Variables instance.
 *
 * @class VariablesParseState
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var Variables = require("./Variables"),
	VariablesIdGenerator = require("./VariablesIdGenerator");

var VariablesParseState = module.exports = function VariablesParseState(idGenerator){
	if (!(idGenerator instanceof VariablesIdGenerator)) throw new Error("idGenerator is required and must be of type VariablesIdGenerator");
	this._idGenerator = idGenerator;
	this._variables = {};
}, klass = VariablesParseState, proto = klass.prototype;

/**
 * Assigns a named variable a unique Id. This differs from all other variables, even
 * others with the same name.
 *
 * The special variables ROOT and CURRENT are always implicitly defined with CURRENT
 * equivalent to ROOT. If CURRENT is explicitly defined by a call to this function, it
 * breaks that equivalence.
 *
 * NOTE: Name validation is responsibility of caller.
 */
proto.defineVariable = function generateId(name) {
	// caller should have validated before hand by using Variables::uassertValidNameForUserWrite
	if (name === "ROOT")
		throw new Error("Can't redefine ROOT; massert code 17275");

	var id = this._idGenerator.generateId();
	this._variables[name] = id;
	return id;
};

/**
 * Returns the current Id for a variable. uasserts if the variable isn't defined.
 * @method getVariable
 * @param name {String} The name of the variable
 */
proto.getVariable = function getIdCount(name) {
	var it = this._variables[name];
	if (typeof it === "number")
		return it;

	if (name !== "ROOT" && name !== "CURRENT")
		throw new Error("Use of undefined variable " + name + "; uassert code 17276");

	return Variables.ROOT_ID;
};
