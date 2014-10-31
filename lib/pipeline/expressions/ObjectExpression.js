"use strict";

/**
 * Create an empty expression.  Until fields are added, this will evaluateInternal to an empty document (object).
 * @class ObjectExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @extends mungedb-aggregate.pipeline.expressions.Expression
 * @constructor
 */
var ObjectExpression = module.exports = function ObjectExpression(atRoot) {
	if (arguments.length !== 1) throw new Error(klass.name + ": expected args: atRoot");
	this.excludeId = false;
	this._atRoot = atRoot;
	this._expressions = {};
	this._order = [];
}, klass = ObjectExpression, Expression = require("./Expression"), base = Expression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});


var Document = require("../Document"),
	Value = require("../Value"),
	FieldPath = require("../FieldPath"),
	ConstantExpression = require("./ConstantExpression");


/**
 * Create an empty expression.
 * Until fields are added, this will evaluate to an empty document.
 * @method create
 * @static
 */
klass.create = function create() {
	return new ObjectExpression(false);
};


/**
 * Like create but uses special handling of _id for root object of $project.
 * @method createRoot
 * @static
 */
klass.createRoot = function createRoot() {
	return new ObjectExpression(true);
};


proto.optimize = function optimize() {
	for (var key in this._expressions) {
		if (!this._expressions.hasOwnProperty(key)) continue;
		var expr = this._expressions[key];
		if (expr)
			expr.optimize();
	}
	return this;
};


proto.isSimple = function isSimple() {
	for (var key in this._expressions) {
		if (!this._expressions.hasOwnProperty(key)) continue;
		var expr = this._expressions[key];
		if (expr && !expr.isSimple())
			return false;
	}
	return true;
};


proto.addDependencies = function addDependencies(deps, path) {
	var pathStr = "";
	if (path) {
		if (path.length === 0) {
			// we are in the top level of a projection so _id is implicit
			if (!this.excludeId)
				deps.fields[Document.ID_PROPERTY_NAME] = 1;
		} else {
			var f = new FieldPath(path);
			pathStr = f.getPath(false);
			pathStr += ".";
		}
	} else {
		if (this.excludeId) throw new Error("Assertion error");
	}
	for (var key in this._expressions) {
		var expr = this._expressions[key];
		if (expr instanceof Expression) {
			if (path) path.push(key);
			expr.addDependencies(deps, path);
			if (path) path.pop();
		} else { // inclusion
			if (!path) throw new Error("inclusion not supported in objects nested in $expressions; uassert code 16407");
			deps.fields[pathStr + key] = 1;
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
*/
proto.addToDocument = function addToDocument(out, currentDoc, vars) {
	var doneFields = {};	// This is used to mark fields we've done so that we can add the ones we haven't

	for (var fieldName in currentDoc) {
		if (!currentDoc.hasOwnProperty(fieldName)) continue;
		var fieldValue = currentDoc[fieldName];

		// This field is not supposed to be in the output (unless it is _id)
		if (!this._expressions.hasOwnProperty(fieldName)) {
			if (!this.excludeId && this._atRoot && fieldName === Document.ID_PROPERTY_NAME) {
				// _id from the root doc is always included (until exclusion is supported)
				// not updating doneFields since "_id" isn't in _expressions
				out[fieldName] = fieldValue;
			}
			continue;
		}

		// make sure we don't add this field again
		doneFields[fieldName] = true;

		var expr = this._expressions[fieldName];
		if (!(expr instanceof Expression)) expr = undefined;
		if (!expr) {
			// This means pull the matching field from the input document
			out[fieldName] = fieldValue;
			continue;
		}

		var objExpr = expr instanceof ObjectExpression ? expr : undefined,
			valueType = Value.getType(fieldValue);
		if ((valueType !== "Object" && valueType !== "Array") || !objExpr) {
			// This expression replace the whole field
			var pValue = expr.evaluateInternal(vars);

			// don't add field if nothing was found in the subobject
			if (objExpr && Object.getOwnPropertyNames(pValue).length === 0)
				continue;

			/*
			 * Don't add non-existent values (note:  different from NULL or Undefined);
			 * this is consistent with existing selection syntax which doesn't
			 * force the appearance of non-existent fields.
			 */
			// if (pValue !== undefined)
				out[fieldName] = pValue; //NOTE: DEVIATION FROM MONGO: we want to keep these in JS

			continue;
		}

		/*
		 * Check on the type of the input value.  If it's an
		 * object, just walk down into that recursively, and
		 * add it to the result.
		 */
		if (valueType === "Object") {
			var sub = {};
			objExpr.addToDocument(sub, fieldValue, vars);
			out[fieldName] = sub;
		} else if (valueType === "Array") {
			/*
			 * If it's an array, we have to do the same thing,
			 * but to each array element.  Then, add the array
			 * of results to the current document.
			 */
			var result = [],
				input = fieldValue;
			for (var fvi = 0, fvl = input.length; fvi < fvl; fvi++) {
				// can't look for a subfield in a non-object value.
				if (Value.getType(input[fvi]) !== "Object")
					continue;

				var doc = {};
				objExpr.addToDocument(doc, input[fvi], vars);
				result.push(doc);
			}

			out[fieldName] = result;
		} else {
			throw new Error("Assertion failure");
		}
	}

	if (Object.getOwnPropertyNames(doneFields).length === Object.getOwnPropertyNames(this._expressions).length)
		return out;	//NOTE: munge returns result as a convenience

	// add any remaining fields we haven't already taken care of
	for (var i = 0, l = this._order.length; i < l; i++) {
		var fieldName2 = this._order[i],
			expr2 = this._expressions[fieldName2];

		// if we've already dealt with this field, above, do nothing
		if (doneFields.hasOwnProperty(fieldName2))
			continue;

		// this is a missing inclusion field
		if (expr2 === null || expr2 === undefined)
			continue;

		var value = expr2.evaluateInternal(vars);

		/*
		 * Don't add non-existent values (note:  different from NULL or Undefined);
		 * this is consistent with existing selection syntax which doesn't
		 * force the appearnance of non-existent fields.
		 */
		if (value === undefined && !(expr2 instanceof ConstantExpression)) //NOTE: DEVIATION FROM MONGO: only if not {$const:undefined}
			continue;

		// don't add field if nothing was found in the subobject
		if (expr2 instanceof ObjectExpression && Object.getOwnPropertyNames(value).length === 0)
			continue;

		out[fieldName2] = value;
	}

	return out;	//NOTE: munge returns result as a convenience
};


/**
* estimated number of fields that will be output
* @method getSizeHint
*/
proto.getSizeHint = function getSizeHint() {
	// Note: this can overestimate, but that is better than underestimating
	return Object.getOwnPropertyNames(this._expressions).length + (this.excludeId ? 0 : 1);
};


/**
* evaluateInternal(), but return a Document instead of a Value-wrapped Document.
* @method evaluateDocument
* @param currentDoc the input Document
* @returns the result document
*/
proto.evaluateDocument = function evaluateDocument(vars) {
	// create and populate the result
	var out = {};
	this.addToDocument(out, {}, vars);	// No inclusion field matching.
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
 */
proto.addField = function addField(fieldPath, pExpression) {
	if (!(fieldPath instanceof FieldPath)) fieldPath = new FieldPath(fieldPath);
	var fieldPart = fieldPath.getFieldName(0),
		haveExpr = this._expressions.hasOwnProperty(fieldPart),
		expr = this._expressions[fieldPart],
		subObj = expr instanceof ObjectExpression ? expr : undefined;	// inserts if !haveExpr

	if (!haveExpr) {
		this._order.push(fieldPart);
	} else { // we already have an expression or inclusion for this field
		if (fieldPath.getPathLength() === 1) {
			// This expression is for right here

			var newSubObj = pExpression instanceof ObjectExpression ? pExpression : undefined;
			if (!(subObj && newSubObj))
				throw new Error("can't add an expression for field " + fieldPart + " because there is already an expression for that field or one of its sub-fields; uassert code 16400"); // we can merge them

			// Copy everything from the newSubObj to the existing subObj
			// This is for cases like { $project:{ 'b.c':1, b:{ a:1 } } }
			for (var i = 0, l = newSubObj._order.length; i < l; ++i) {
				var key = newSubObj._order[i];
				// asserts if any fields are dupes
				subObj.addField(key, newSubObj._expressions[key]);
			}
			return;
		} else {
			// This expression is for a subfield
			if(!subObj)
				throw new Error("can't add an expression for a subfield of " + fieldPart + " because there is already an expression that applies to the whole field; uassert code 16401");
		}
	}

	if (fieldPath.getPathLength() === 1) {
		if (haveExpr) throw new Error("Assertion error."); // haveExpr case handled above.
		this._expressions[fieldPart] = pExpression;
		return;
	}

	if (!haveExpr)
		this._expressions[fieldPart] = subObj = ObjectExpression.create();

	subObj.addField(fieldPath.tail(), pExpression);
};


/**
 * Add a field path to the set of those to be included.
 *
 * Note that including a nested field implies including everything on the path leading down to it.
 *
 * @method includePath
 * @param fieldPath the name of the field to be included
 */
proto.includePath = function includePath(theFieldPath) {
	this.addField(theFieldPath, null);
};


proto.serialize = function serialize(explain) {
	var valBuilder = {};

	if (this.excludeId)
		valBuilder[Document.ID_PROPERTY_NAME] = false;

	for (var i = 0, l = this._order.length; i < l; ++i) {
		var fieldName = this._order[i];
		if (!this._expressions.hasOwnProperty(fieldName)) throw new Error("Assertion failure");
		var expr = this._expressions[fieldName];

		if (!expr) {
			valBuilder[fieldName] = true;
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
 */
proto.getFieldCount = function getFieldCount() {
	return Object.getOwnPropertyNames(this._expressions).length;
};
