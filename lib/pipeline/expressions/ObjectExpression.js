"use strict";

/**
 * Create an empty expression.  Until fields are added, this will evaluateInternal to an empty document (object).
 * @class ObjectExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @extends mungedb-aggregate.pipeline.expressions.Expression
 * @constructor
 **/
var ObjectExpression = module.exports = function ObjectExpression(atRoot){
	if (arguments.length !== 1) throw new Error("one arg expected");
	this.excludeId = false;	/// <Boolean> for if _id is to be excluded
	this.atRoot = atRoot;
	this._expressions = {};	/// <Object<Expression>> mapping from fieldname to Expression to generate the value NULL expression means include from source document
	this._order = []; /// <Array<String>> this is used to maintain order for generated fields not in the source document
}, klass = ObjectExpression, Expression = require("./Expression"), base = Expression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.create = function create() {
	return new ObjectExpression(false);
};

klass.createRoot = function createRoot() {
	return new ObjectExpression(true);
};

// DEPENDENCIES
var Document = require("../Document"),
	FieldPath = require("../FieldPath");

// INSTANCE VARIABLES
/**
 * <Boolean> for if _id is to be excluded
 * @property excludeId
 **/
proto.excludeId = undefined;

/**
 * <Object<Expression>> mapping from fieldname to Expression to generate the value NULL expression means include from source document
 **/
proto._expressions = undefined;

//TODO: might be able to completely ditch _order everywhere in here since `Object`s are mostly ordered anyhow but need to come back and revisit that later
/**
 * <Array<String>> this is used to maintain order for generated fields not in the source document
 **/
proto._order = [];


// PROTOTYPE MEMBERS

/**
 * evaluateInternal(), but return a Document instead of a Value-wrapped Document.
 * @method evaluateDocument
 * @param currentDoc the input Document
 * @returns the result document
 **/
proto.evaluateDocument = function evaluateDocument(vars) {
	// create and populate the result
	var pResult = {_id:0};
	this.addToDocument(pResult, pResult, vars); // No inclusion field matching.
	return pResult;
};

proto.evaluateInternal = function evaluateInternal(vars) { //TODO: collapse with #evaluateDocument()?
	return this.evaluateDocument(vars);
};

proto.optimize = function optimize(){
	for (var key in this._expressions) {
		var expr = this._expressions[key];
		if (expr !== undefined && expr !== null) this._expressions[key] = expr.optimize();
	}
	return this;
};

proto.isSimple = function isSimple(){
	for (var key in this._expressions) {
		var expr = this._expressions[key];
		if (expr !== undefined && expr !== null && !expr.isSimple()) return false;
	}
	return true;
};

proto.addDependencies = function addDependencies(deps, path){
	var pathStr = "";
	if (path instanceof Array) {
		if (path.length === 0) {
			// we are in the top level of a projection so _id is implicit
			if (!this.excludeId) {
							deps[Document.ID_PROPERTY_NAME] = 1;
						}
		} else {
			pathStr = new FieldPath(path).getPath() + ".";
		}
	} else {
		if (this.excludeId) throw new Error("excludeId is true!");
	}
	for (var key in this._expressions) {
		var expr = this._expressions[key];
		if (expr !== undefined && expr !== null) {
			if (path instanceof Array) path.push(key);
			expr.addDependencies(deps, path);
			if (path instanceof Array) path.pop();
		} else { // inclusion
			if (path === undefined || path === null) throw new Error("inclusion not supported in objects nested in $expressions; uassert code 16407");
			deps[pathStr + key] = 1;
		}
	}

	return deps;	// NOTE: added to munge as a convenience
};

/**
 * evaluateInternal(), but add the evaluated fields to a given document instead of creating a new one.
 * @method addToDocument
 * @param pResult the Document to add the evaluated expressions to
 * @param currentDoc the input Document for this level
 * @param vars the root of the whole input document
 **/
proto.addToDocument = function addToDocument(out, currentDoc, vars){


	var doneFields = {};	// This is used to mark fields we've done so that we can add the ones we haven't

	for(var fieldName in currentDoc){
		if (!currentDoc.hasOwnProperty(fieldName)) continue;
		var fieldValue = currentDoc[fieldName];

		// This field is not supposed to be in the output (unless it is _id)
		if (!this._expressions.hasOwnProperty(fieldName)) {
			if (!this.excludeId && this.atRoot && fieldName == Document.ID_PROPERTY_NAME) {
				// _id from the root doc is always included (until exclusion is supported)
				// not updating doneFields since "_id" isn't in _expressions
				out[fieldName] = fieldValue;
			}
			continue;
		}

		// make sure we don't add this field again
		doneFields[fieldName] = true;

		// This means pull the matching field from the input document
		var expr = this._expressions[fieldName];
		if (!(expr instanceof Expression)) {
			out[fieldName] = fieldValue;
			continue;
		}

		// Check if this expression replaces the whole field
		if (!(fieldValue instanceof Object) || (fieldValue.constructor !== Object && fieldValue.constructor !== Array) || !(expr instanceof ObjectExpression)) {
			var pValue = expr.evaluateInternal(vars);

			// don't add field if nothing was found in the subobject
			if (expr instanceof ObjectExpression && pValue instanceof Object && Object.getOwnPropertyNames(pValue).length === 0) continue;

			// Don't add non-existent values (note:  different from NULL); this is consistent with existing selection syntax which doesn't force the appearnance of non-existent fields.
			// TODO make missing distinct from Undefined
			if (pValue !== undefined) out[fieldName] = pValue;
			continue;
		}

		// Check on the type of the input value.  If it's an object, just walk down into that recursively, and add it to the result.
		if (fieldValue instanceof Object && fieldValue.constructor === Object) {
			out[fieldName] = expr.addToDocument({}, fieldValue, vars);	//TODO: pretty sure this is broken;
		} else if (fieldValue instanceof Object && fieldValue.constructor === Array) {
			// If it's an array, we have to do the same thing, but to each array element.  Then, add the array of results to the current document.
			var result = [];
			for(var fvi = 0, fvl = fieldValue.length; fvi < fvl; fvi++){
				var subValue = fieldValue[fvi];
				if (subValue.constructor !== Object) continue;	// can't look for a subfield in a non-object value.
				result.push(expr.addToDocument({}, subValue, vars));
			}
			out[fieldName] = result;
		} else {
			throw new Error("should never happen");	//verify( false );
		}
	}

	if (Object.getOwnPropertyNames(doneFields).length == Object.getOwnPropertyNames(this._expressions).length) return out;	//NOTE: munge returns result as a convenience

	// add any remaining fields we haven't already taken care of
	for(var i = 0, l = this._order.length; i < l; i++){
		var fieldName2 = this._order[i];
		var expr2 = this._expressions[fieldName2];

		// if we've already dealt with this field, above, do nothing
		if (doneFields.hasOwnProperty(fieldName2)) continue;

		// this is a missing inclusion field
		if (!expr2) continue;

		var value = expr2.evaluateInternal(vars);

		// Don't add non-existent values (note:  different from NULL); this is consistent with existing selection syntax which doesn't force the appearnance of non-existent fields.
		if (value === undefined || (typeof(value) == 'object' && value !== null && Object.keys(value).length === 0)) continue;

		// don't add field if nothing was found in the subobject
		if (expr2 instanceof ObjectExpression && value && value instanceof Object && Object.getOwnPropertyNames(value) == {} ) continue;

		out[fieldName2] = value;
	}

	return out;	//NOTE: munge returns result as a convenience
};

/**
 * estimated number of fields that will be output
 * @method getSizeHint
 **/
proto.getSizeHint = function getSizeHint(){
	// Note: this can overestimate, but that is better than underestimating
	return Object.getOwnPropertyNames(this._expressions).length + (this.excludeId ? 0 : 1);
};


proto.evaluateDocument = function evaluateDocument(vars) {
	var out = {};
	this.addToDocument(out, {}, vars);
	return out;
};

proto.evaluateInternal = function evaluateInternal(vars) {
	return this.evaluateDocument(vars);
};


/**
 * Add a field to the document expression.
 * @method addField
 * @param fieldPath the path the evaluated expression will have in the result Document
 * @param pExpression the expression to evaluateInternal obtain this field's Value in the result Document
 **/
proto.addField = function addField(fieldPath, pExpression){
	if(!(fieldPath instanceof FieldPath)) fieldPath = new FieldPath(fieldPath);
	var fieldPart = fieldPath.getFieldName(0),
		haveExpr = this._expressions.hasOwnProperty(fieldPart),
		subObj = this._expressions[fieldPart];	// inserts if !haveExpr //NOTE: not in munge & JS it doesn't, handled manually below

	if (!haveExpr) {
		this._order.push(fieldPart);
	} else { // we already have an expression or inclusion for this field
		if (fieldPath.getPathLength() == 1) { // This expression is for right here
			if (!(subObj instanceof ObjectExpression && typeof pExpression == "object" && pExpression instanceof ObjectExpression)){
				throw new Error("can't add an expression for field `" + fieldPart + "` because there is already an expression for that field or one of its sub-fields; uassert code 16400"); // we can merge them
			}

			// Copy everything from the newSubObj to the existing subObj
			// This is for cases like { $project:{ 'b.c':1, b:{ a:1 } } }
			for (var key in pExpression._expressions) {
				if (pExpression._expressions.hasOwnProperty(key)) {
					subObj.addField(key, pExpression._expressions[key]); // asserts if any fields are dupes
				}
			}
			return;
		} else { // This expression is for a subfield
			if(!subObj) throw new Error("can't add an expression for a subfield of `" + fieldPart + "` because there is already an expression that applies to the whole field; uassert code 16401");
		}
	}

	if (fieldPath.getPathLength() == 1) {
		if(haveExpr) throw new Error("Internal error."); // haveExpr case handled above.
		this._expressions[fieldPart] = pExpression;
		return;
	}

	if (!haveExpr) subObj = this._expressions[fieldPart] = new ObjectExpression(false);

	subObj.addField(fieldPath.tail(), pExpression);
};

/**
 * Add a field path to the set of those to be included.
 *
 * Note that including a nested field implies including everything on the path leading down to it.
 *
 * @method includePath
 * @param fieldPath the name of the field to be included
 **/
proto.includePath = function includePath(path){
	this.addField(path, null);
};


proto.serialize = function serialize(explain) {
	var valBuilder = {};

	if(this._excludeId) {
		valBuilder._id = false;
	}

	for(var ii = 0; ii < this._order.length; ii ++) {
		var fieldName = this._order[ii],
			expr = this._expressions[fieldName];

		if(expr === undefined || expr === null) {
			valBuilder[fieldName] = {$const:expr};
		} else {
			valBuilder[fieldName] = expr.serialize(explain);
		}

	}
	return valBuilder;
};



/**
 * Get a count of the added fields.
 * @method getFieldCount
 * @returns how many fields have been added
 **/
proto.getFieldCount = function getFieldCount(){
	return Object.getOwnPropertyNames(this._expressions).length;
};

///**
//* Specialized BSON conversion that allows for writing out a $project specification.
//* This creates a standalone object, which must be added to a containing object with a name
//*
//* @param pBuilder where to write the object to
//* @param requireExpression see Expression::addToBsonObj
//**/
//TODO:	proto.documentToBson = ...?
//TODO:	proto.addToBsonObj = ...?
//TODO: proto.addToBsonArray = ...?

//NOTE: in `munge` we're not passing the `Object`s in and allowing `toJSON` (was `documentToBson`) to modify it directly and are instead building and returning a new `Object` since that's the way it's actually used
proto.toJSON = function toJSON(requireExpression){
	var o = {};
	if (this.excludeId) o[Document.ID_PROPERTY_NAME] = false;
	for (var i = 0, l = this._order.length; i < l; i++) {
		var fieldName = this._order[i];
		if (!this._expressions.hasOwnProperty(fieldName)) throw new Error("internal error: fieldName from _ordered list not found in _expressions");
		var fieldValue = this._expressions[fieldName];
		if (fieldValue === undefined) {
			o[fieldName] = true; // this is inclusion, not an expression
		} else {
			o[fieldName] = fieldValue.toJSON(requireExpression);
		}
	}
	return o;
};
