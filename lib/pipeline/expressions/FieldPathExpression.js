"use strict";

/**
 * Create a field path expression. Evaluation will extract the value associated with the given field path from the source document.
 * @class FieldPathExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @extends mungedb-aggregate.pipeline.expressions.Expression
 * @constructor
 * @param {String} fieldPath the field path string, without any leading document indicator
 **/

var Expression = require("./Expression"),
    Variables = require("./Variables"),
    Value = require("../Value"),
    FieldPath = require("../FieldPath");


var FieldPathExpression = module.exports = function FieldPathExpression(path, variableId){
    if (arguments.length > 2) throw new Error("args expected: path[, vps]");
    this.path = new FieldPath(path);
    if(arguments.length == 2) {
        this.variable = variableId;
    } else {
        this.variable = Variables.ROOT_ID;
    }
}, klass = FieldPathExpression, base = require("./Expression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.create = function create(path) {
    return new FieldPathExpression("CURRENT."+path, Variables.ROOT_ID);
};


// PROTOTYPE MEMBERS
proto.evaluateInternal = function evaluateInternal(vars){

    if(this.path.fields.length === 1) {
        return vars.getValue(this.variable);
    }

    if(this.variable === Variables.ROOT_ID) {
        return this.evaluatePath(1, vars.getRoot());
    }

    var vari = vars.getValue(this.variable);
    if(vari instanceof Array) {
        return this.evaluatePathArray(1,vari);
    } else if (vari instanceof Object) {
        return this.evaluatePath(1, vari);
    } else {
        return undefined;
    }
};


/**
 * Parses a fieldpath using the mongo 2.5 spec with optional variables
 *
 * @param raw raw string fieldpath
 * @param vps variablesParseState
 * @returns a new FieldPathExpression
 **/
klass.parse = function parse(raw, vps) {
    if(raw[0] !== "$") {
        throw new Error("FieldPath: '" + raw + "' doesn't start with a $");
    }
    if(raw.length === 1) {
        throw new Error("'$' by itself is not a valid FieldPath");
    }

    if(raw[1] === "$") {
        var firstPeriod = raw.indexOf('.');
        var varname = (firstPeriod === -1 ? raw.slice(2) : raw.slice(2,firstPeriod));
        Variables.uassertValidNameForUserRead(varname);
        return new FieldPathExpression(raw.slice(2), vps.getVariableName(varname));
    } else {
        return new FieldPathExpression("CURRENT." + raw.slice(1), vps.getVariable("CURRENT"));
    }
};


/**
 * Parses a fieldpath using the mongo 2.5 spec with optional variables
 *
 * @param raw raw string fieldpath
 * @param vps variablesParseState
 * @returns a new FieldPathExpression
 **/
proto.optimize = function optimize() {
    return this;
};


/**
 * Internal implementation of evaluate(), used recursively.
 *
 * The internal implementation doesn't just use a loop because of the
 * possibility that we need to skip over an array.  If the path is "a.b.c",
 * and a is an array, then we fan out from there, and traverse "b.c" for each
 * element of a:[...].  This requires that a be an array of objects in order
 * to navigate more deeply.
 *
 * @param index current path field index to extract
 * @param pathLength maximum number of fields on field path
 * @param pDocument current document traversed to (not the top-level one)
 * @returns the field found; could be an array
 **/
proto._evaluatePath = function _evaluatePath(obj, i, len){
	var fieldName = this.path.fields[i],
		field = obj[fieldName]; // It is possible we won't have an obj (document) and we need to not fail if that is the case

	// if the field doesn't exist, quit with an undefined value
	if (field === undefined) return undefined;

	// if we've hit the end of the path, stop
	if (++i >= len) return field;

	// We're diving deeper.  If the value was null, return null
	if(field === null) return undefined;

	if (field.constructor === Object) {
		return this._evaluatePath(field, i, len);
	} else if (Array.isArray(field)) {
		var results = [];
		for (var i2 = 0, l2 = field.length; i2 < l2; i2++) {
			var subObj = field[i2],
				subObjType = typeof(subObj);
			if (subObjType === "undefined" || subObj === null) {
				results.push(subObj);
			} else if (subObj.constructor === Object) {
				results.push(this._evaluatePath(subObj, i, len));
			} else {
				throw new Error("the element '" + fieldName + "' along the dotted path '" + this.path.getPath() + "' is not an object, and cannot be navigated.; code 16014");
			}
		}
		return results;
	}
	return undefined;
};

proto.evaluatePathArray = function evaluatePathArray(index, input) {

    if(!(input instanceof Array)) {
        throw new Error("evaluatePathArray called on non-array");
    }
    var result = [];

    for(var ii = 0; ii < input.length; ii++) {
        if(input[ii] instanceof Object) {
            var nested = this.evaluatePath(index, input[ii]);
            if(nested) {
				result.push(nested);
            }
        }
    }
    return result;
};


proto.evaluatePath = function(index, input) {
    if(index === this.path.fields.length -1) {
        return input[this.path.fields[index]];
    }
    var val = input[this.path.fields[index]];
    if(val instanceof Array) {
        return this.evaluatePathArray(index+1, val);
    } else if (val instanceof Object) {
        return this.evaluatePath(index+1, val);
    } else {
        return undefined;
    }

};



proto.optimize = function(){
        return this;
};

proto.addDependencies = function addDependencies(deps){
	if(this.path.fields[0] === "CURRENT" || this.path.fields[0] === "ROOT") {
		if(this.path.fields.length === 1) {
			deps[""] = 1;
		} else {
			deps[this.path.tail().getPath(false)] = 1;
		}
	}
};

// renamed write to get because there are no streams
proto.getFieldPath = function getFieldPath(usePrefix){
        return this.path.getPath(usePrefix);
};

proto.serialize = function toJSON(){
    if(this.path.fields[0] === "CURRENT" && this.path.fields.length > 1) {
        return "$" + this.path.tail().getPath(false);
    } else {
        return "$$" + this.path.getPath(false);
    }
};

//TODO: proto.addToBsonObj = ...?
//TODO: proto.addToBsonArray = ...?

//proto.writeFieldPath = ...?   use #getFieldPath instead
