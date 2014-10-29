"use strict";

var MapExpression = module.exports = function MapExpression(varName, varId, input, each){
	if (arguments.length !== 4) throw new Error("Four args expected");
	this._varName = varName;
	this._varId = varId;
	this._input = input;
	this._each = each;
}, klass = MapExpression, Expression = require("./Expression"), base = Expression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Variables = require("./Variables"),
	VariablesParseState = require("./VariablesParseState");

// PROTOTYPE MEMBERS


klass.parse = function parse(expr, vpsIn){
	if(!("$map" in expr)) {
		throw new Error("Tried to create a $let with something other than let. Looks like your parse map went all funny.");
	}

	if(typeof(expr.$map) !== 'object' || (expr.$map instanceof Array)) {
		throw new Error("$map only supports an object as it's argument:16878");
	}

	var args = expr.$map,
		inputElem = args.input,
		inElem = args['in'],
		asElem = args.as;

	if(!inputElem) {
		throw new Error("Missing 'input' parameter to $map: 16880");
	}
	if(!asElem) {
		throw new Error("Missing 'as' parameter to $map: 16881");
	}
	if(!inElem) {
		throw new Error("Missing 'in' parameter to $let: 16882");
	}


	if(Object.keys(args).length > 3) {
		var bogus = Object.keys(args).filter(function(x) {return !(x === 'in' || x === 'as' || x === 'input');});
		throw new Error("Unrecognized parameter to $map: " + bogus.join(",") + "- 16879");
	}

	// parse "input"
	var input = Expression.parseOperand(inputElem, vpsIn);

	// parse "as"
	var vpsSub = new VariablesParseState(vpsIn),
		varName = asElem;

	Variables.uassertValidNameForUserWrite(varName);
	var varId = vpsSub.defineVariable(varName);

	// parse ""in
	var invert = Expression.parseOperand(inElem, vpsSub);

	return new MapExpression(varName, varId, input, invert);
};


proto.optimize = function optimize() {
	this._input = this._input.optimize();
	this._each = this._each.optimize();
	return this;
};

proto.serialize = function serialize(explain) {
	return {$map: {input:this._input.serialize(explain),
				   as: this._varName,
				   'in': this._each.serialize(explain)}};
};

proto.evaluateInternal = function evaluateInternal(vars) {

	// guaranteed at parse time that this isn't using our _varId
	var inputVal = this._input.evaluateInternal(vars);
	if( inputVal === null || inputVal === undefined) {
		return null;
	}

	if(!(inputVal instanceof Array)) {
		throw new Error("Uassert 16883: Input to $map must be an Array, not a " + typeof inputVal);
	}

	if(inputVal.length === 0) {
		return inputVal;
	}

	// Diverge from Mongo source here, as Javascript has a builtin map operator.
	return inputVal.map(function(x) {
	   vars.setValue(this._varId, x);
	   var toInsert = this._each.evaluateInternal(vars);
	   if(toInsert === undefined) {
		   toInsert = null;
	   }

	   return toInsert;
   });
};

proto.addDependencies = function addDependencies(deps, path){
	this._input.addDependencies(deps, path);
	this._each.addDependencies(deps, path);
	return deps;
};


Expression.registerExpression("$map", klass.parse);
