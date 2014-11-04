"use strict";

var LetExpression = module.exports = function LetExpression(vars, subExpression){
	if (arguments.length !== 2) throw new Error("Two args expected");
	this._variables = vars;
	this._subExpression = subExpression;
}, klass = LetExpression, Expression = require("./Expression"), base = Expression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Variables = require("./Variables"),
	VariablesParseState = require("./VariablesParseState");

// PROTOTYPE MEMBERS

klass.parse = function parse(expr, vpsIn){
	//NOTE: DEVIATION FROM MONGO: I don't believe this works for us since the operator has been removed from expr by the time
	// we get here.
//	if(!("$let" in expr)) {
//		throw new Error("Tried to create a $let with something other than let. Looks like your parse map went all funny.");
//	}

	if(typeof(expr) !== 'object' || (expr instanceof Array)) {
		throw new Error("$let only supports an object as its argument: 16874");
	}

	var args = expr,
		varsElem = args.vars,
		inElem = args['in']; // args.in; ??

	//NOTE: DEVIATION FROM MONGO: 1. These if statements are in a loop in the c++ version,
	// 2. 'vars' and 'in' are each mandatory here. in the c++ code you only need one of the two.
	// 3. Below, we croak if there are more than 2 arguments.  The original does not have this limitation, specifically.
	// Upon further review, I think our code is more accurate.  The c++ code will accept if there are multiple 'in'
	// or 'var' values. The previous ones will be overwritten by newer ones.
	//
	// Final note - I think this code is fine.
	//
	if(!varsElem) {
		throw new Error("Missing 'vars' parameter to $let: 16876");
	}
	if(!inElem) {
		throw new Error("Missing 'in' parameter to $let: 16877");
	}

	// Should this be !== 2?  Why would we have fewer than 2 arguments?  Why do we even care what the length of the
	// array is? It may be an optimization of sorts. But what we're really wanting here is, 'If any keys are not "in"
	// or "vars" then we need to bugcheck.'
	if(Object.keys(args).length > 2) {
		var bogus = Object.keys(args).filter(function(x) {return !(x === 'in' || x === 'vars');});
		throw new Error("Unrecognized parameter to $let: " + bogus.join(",") + "- 16875");
	}

	var vpsSub = vpsIn, //new VariablesParseState(vpsIn),
		vars = {};

	varsElem.forEach(function(varName){
		Variables.uassertValidNameForUserWrite(varName);
		var id = vpsSub.defineVariable(varName);

		vars[id] = {};
		vars[id][varName] = Expression.parseOperand(varsElem, vpsIn);
	});

	var subExpression = Expression.parseOperand(inElem, vpsSub);
	return new LetExpression(vars, subExpression);
};

proto.optimize = function optimize() {
	// This statement doesn't look necessary. We do this work later on if there aren't (or are!) variables.
	if(this._variables.length == 0) {
		return this._subExpression.optimize();
	}

	for(var id in this._variables){
		for(var name in this._variables[id]) {
			//NOTE: DEVIATION FROM MONGO: This is actually ok. The c++ code does this with a single map. The js structure
			// is nested objects.
			this._variables[id][name] = this._variables[id][name].optimize();
		}
	}

	this._subExpression = this._subExpression.optimize();

	return this;
};

proto.serialize = function serialize(explain) {
	var vars = {};
	for(var id in this._variables) {
		for(var name in this._variables[id]) {
			vars[name] = this._variables[id][name];
		}
	}

	return {$let: {vars:vars, 'in':this._subExpression.serialize(explain)}};
};

proto.evaluateInternal = function evaluateInternal(vars) {
	for(var id in this._variables) {
		for(var name in this._variables[id]) {
			vars.setValue(id, this._variables[id][name]);
		}
	}

	return this._subExpression.evaluateInternal(vars);
};

proto.addDependencies = function addDependencies(deps, path){
	for(var id in this._variables) {
		for(var name in this._variables[id]) {
			this._variables[id][name].addDependencies(deps);
		}
	}
	this._subExpression.addDependencies(deps, path);
	return deps; //NOTE: DEVIATION FROM MONGO: The c++ version does not return a value. We seem to use the returned value
					// (or something from a different method named
					// addDependencies) in many places.

};

Expression.registerExpression("$let", LetExpression.parse);
