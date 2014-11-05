"use strict";

var LetExpression = module.exports = function LetExpression(vars, subExpression){
	if (arguments.length !== 2) throw new Error(klass.name + ": expected args: vars, subExpression");
	this._variables = vars;
	this._subExpression = subExpression;
}, klass = LetExpression, Expression = require("./Expression"), base = Expression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});


var Value = require("../Value"),
	Variables = require("./Variables");


function NameAndExpression(name, expr){
	this.name = name;
	this.expression = expr;
}


klass.parse = function parse(expr, vpsIn){

	// if (!(exprFieldName === "$let")) throw new Error("Assertion failure"); //NOTE: DEVIATION FROM MONGO: we do not have exprFieldName here

	if (Value.getType(expr) !== "Object")
		throw new Error("$let only supports an object as it's argument; uassert code 16874");
	var args = expr;

	// varsElem must be parsed before inElem regardless of BSON order.
	var varsElem,
		inElem;
	for (var argFieldName in args) {
		var arg = args[argFieldName];
		if (argFieldName === "vars") {
			varsElem = arg;
		} else if (argFieldName === "in") {
			inElem = arg;
		} else {
			throw new Error("Unrecognized parameter to $let: " + argFieldName + "; uasserted code 16875");
		}
	}

	if (!varsElem)
		throw new Error("Missing 'vars' parameter to $let; uassert code 16876");
	if (!inElem)
		throw new Error("Missing 'in' parameter to $let; uassert code 16877");

	// parse "vars"
	var vpsSub = vpsIn, // vpsSub gets our vars, vpsIn doesn't.
		vars = {}; // using like a VariableMap
	if (Value.getType(varsElem) !== "Object") //NOTE: emulate varsElem.embeddedObjectUserCheck()
		throw new Error("invalid parameter: expected an object (vars); uasserted code 10065");
	for (var varName in varsElem) {
		var varElem = varsElem[varName];
		Variables.uassertValidNameForUserWrite(varName);
		var id = vpsSub.defineVariable(varName);

		vars[id] = new NameAndExpression(varName,
			Expression.parseOperand(varElem, vpsIn)); // only has outer vars
	}

	// parse "in"
	var subExpression = Expression.parseOperand(inElem, vpsSub); // has our vars

	return new LetExpression(vars, subExpression);
};


proto.optimize = function optimize() {
	if (Object.keys(this._variables).length === 0) {
		// we aren't binding any variables so just return the subexpression
		return this._subExpression.optimize();
	}

	for (var id in this._variables) {
		this._variables[id].expression = this._variables[id].expression.optimize();
	}

	// TODO be smarter with constant "variables"
	this._subExpression = this._subExpression.optimize();

	return this;
};


proto.serialize = function serialize(explain) {
	var vars = {};
	for (var id in this._variables) {
		vars[this._variables[id].name] = this._variables[id].expression.serialize(explain);
	}

	return {
		$let: {
			vars: vars,
			in : this._subExpression.serialize(explain)
		}
	};
};


proto.evaluateInternal = function evaluateInternal(vars) {
	for (var id in this._variables) {
		var itFirst = +id, //NOTE: using the unary + to coerce it to a Number
			itSecond = this._variables[itFirst];
		// It is guaranteed at parse-time that these expressions don't use the variable ids we
		// are setting
		vars.setValue(itFirst,
			itSecond.expression.evaluateInternal(vars));
	}

	return this._subExpression.evaluateInternal(vars);
};


proto.addDependencies = function addDependencies(deps, path){
	for (var id in this._variables) {
		var itFirst = +id, //NOTE: using the unary + to coerce it to a Number
			itSecond = this._variables[itFirst];
			itSecond.expression.addDependencies(deps);
	}

	// TODO be smarter when CURRENT is a bound variable
	this._subExpression.addDependencies(deps);
};


Expression.registerExpression("$let", LetExpression.parse);
