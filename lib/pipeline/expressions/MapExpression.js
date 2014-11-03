"use strict";

var MapExpression = module.exports = function MapExpression(varName, varId, input, each){
	if (arguments.length !== 4) throw new Error(klass.name + ": args expected: varName, varId, input, each");
	this._varName = varName;
	this._varId = varId;
	this._input = input;
	this._each = each;
}, klass = MapExpression, Expression = require("./Expression"), base = Expression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var Value = require("../Value"),
	Variables = require("./Variables");

klass.parse = function parse(expr, vpsIn) {

	// if (!(exprFieldName)) throw new Error("Assertion failure"); //NOTE: DEVIATION FROM MONGO: we do not have exprFieldName here

	if (Value.getType(expr) !== "Object") {
		throw new Error("$map only supports an object as it's argument; uassert code 16878");
	}

	// "in" must be parsed after "as" regardless of BSON order
	var inputElem,
		asElem,
		inElem,
		args = expr;
	for (var argFieldName in args) {
		var arg = args[argFieldName];
		if (argFieldName === "input") {
			inputElem = arg;
		} else if (argFieldName === "as") {
			asElem = arg;
		} else if (argFieldName === "in") {
			inElem = arg;
		} else {
			throw new Error("Unrecognized parameter to $map: " + argFieldName + "; uassert code 16879");
		}
	}

	if (!inputElem) throw new Error("Missing 'input' parameter to $map; uassert code 16880");
	if (!asElem) throw new Error("Missing 'as' parameter to $map; uassert code 16881");
	if (!inElem) throw new Error("Missing 'in' parameter to $map; uassert code 16882");

	// parse "input"
	var input = Expression.parseOperand(inputElem, vpsIn); // only has outer vars

	// parse "as"
	var vpsSub = vpsIn, // vpsSub gets our vars, vpsIn doesn't.
		varName = asElem;
	Variables.uassertValidNameForUserWrite(varName);
	var varId = vpsSub.defineVariable(varName);

	// parse "in"
	var inExpr = Expression.parseOperand(inElem, vpsSub); // has access to map variable

	return new MapExpression(varName, varId, input, inExpr);
};

proto.optimize = function optimize() {
	// TODO handle when _input is constant
	this._input = this._input.optimize();
	this._each = this._each.optimize();
	return this;
};

proto.serialize = function serialize(explain) {
	return {
		$map: {
			input: this._input.serialize(explain),
			as: this._varName,
			in : this._each.serialize(explain)
		}
	};
};

proto.evaluateInternal = function evaluateInternal(vars) {
	// guaranteed at parse time that this isn't using our _varId
	var inputVal = this._input.evaluateInternal(vars);
	if (inputVal === null || inputVal === undefined)
		return null;

	if (!(inputVal instanceof Array)){
		throw new Error("input to $map must be an Array not " +
			Value.getType(inputVal) + "; uassert code 16883");
	}

	if (inputVal.length === 0)
		return inputVal;

	var output = new Array(inputVal.length);
	for (var i = 0, l = inputVal.length; i < l; i++) {
		vars.setValue(this._varId, inputVal[i]);

		var toInsert = this._each.evaluateInternal(vars);
		if (toInsert === undefined)
			toInsert = null; // can't insert missing values into array

		output[i] = toInsert;
	}

	return output;
};

proto.addDependencies = function addDependencies(deps, path) { //jshint ignore:line
	this._input.addDependencies(deps);
	this._each.addDependencies(deps);
	return deps;
};

Expression.registerExpression("$map", klass.parse);
