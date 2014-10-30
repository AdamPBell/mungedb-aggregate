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


proto.parse = function parse(expr, vpsIn){
	if(!("$let" in expr)) {
		throw new Error("Tried to create a $let with something other than let. Looks like your parse map went all funny.");
	}

	if(typeof(expr.$let) !== 'object' || (expr.$let instanceof Array)) {
		throw new Error("$let only supports an object as it's argument:16874");
	}

	var args = expr.$let,
		varsElem = args.vars,
		inElem = args['in'];

	if(!varsElem) {
		throw new Error("Missing 'vars' parameter to $let: 16876");
	}
	if(!inElem) {
		throw new Error("Missing 'in' parameter to $let: 16877");
	}

	if(Object.keys(args).length > 2) {
		var bogus = Object.keys(args).filter(function(x) {return !(x === 'in' || x === 'vars');});
		throw new Error("Unrecognized parameter to $let: " + bogus.join(",") + "- 16875");
	}

	var vpsSub = new VariablesParseState(vpsIn),
		vars = {};

	for(var varName in varsElem) {
		Variables.uassertValidNameForUserWrite(varName);
		var id = vpsSub.defineVariable(varName);

		vars[id] = {};
		vars[id][varName] = Expression.parseOperand(varsElem, vpsIn);
	}

	var subExpression = Expression.parseOperand(inElem, vpsSub);
	return new LetExpression(vars, subExpression);
};

proto.optimize = function optimize() {
	if(this._variables.empty()) {
		return this._subExpression.optimize();
	}

	for(var id in this._variables){
		for(var name in this._variables[id]) {
			this._variables[id][name] = this._variables[id][name].optimize();
		}
	}

	this._subExpression = this._subExpression.optimize();

	return this;
};

proto.addDependencies = function addDependencies(deps, path){
	for(var id in this._variables) {
		for(var name in this._variables[id]) {
			this._variables[id][name].addDependencies(deps);
		}
	}
	this._subExpression.addDependencies(deps, path);
	return deps;

};

proto.evaluateInternal = function evaluateInternal(vars) {
	for(var id in this._variables) {
		for(var name in this._variables[id]) {
			vars.setValue(id, this._variables[id][name]);
		}
	}

	return this._subExpression.evaluateInternal(vars);
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

Expression.registerExpression("$let", LetExpression.parse);
