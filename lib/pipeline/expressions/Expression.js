"use strict";

/**
 * A base class for all pipeline expressions; Performs common expressions within an Op.
 *
 * NOTE: An object expression can take any of the following forms:
 *
 *      f0: {f1: ..., f2: ..., f3: ...}
 *      f0: {$operator:[operand1, operand2, ...]}
 *
 * @class Expression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/


var Expression = module.exports = function Expression() {
	if (arguments.length !== 0) throw new Error("zero args expected");
}, klass = Expression,
    base = Object,
    proto = klass.prototype = Object.create(base.prototype, {
		constructor: {
			value: klass
		}
    });



function fn(){
	return;
}


// NESTED CLASSES
/**
 * Reference to the `mungedb-aggregate.pipeline.expressions.Expression.ObjectCtx` class
 * @static
 * @property ObjectCtx
 **/
var ObjectCtx = Expression.ObjectCtx = (function() {
	// CONSTRUCTOR
	/**
	 * Utility class for parseObject() below. isDocumentOk indicates that it is OK to use a Document in the current context.
	 *
	 * NOTE: deviation from Mongo code: accepts an `Object` of settings rather than a bitmask to help simplify the interface a little bit
	 *
	 * @class ObjectCtx
	 * @namespace mungedb-aggregate.pipeline.expressions.Expression
	 * @module mungedb-aggregate
	 * @constructor
	 * @param opts
	 *      @param [opts.isDocumentOk]      {Boolean}
	 *      @param [opts.isTopLevel]        {Boolean}
	 *      @param [opts.isInclusionOk]     {Boolean}
	 **/
	var klass = function ObjectCtx(opts /*= {isDocumentOk:..., isTopLevel:..., isInclusionOk:...}*/ ) {
		if (!(opts instanceof Object && opts.constructor == Object)) throw new Error("opts is required and must be an Object containing named args");
		for (var k in opts) { // assign all given opts to self so long as they were part of klass.prototype as undefined properties
			if (opts.hasOwnProperty(k) && proto.hasOwnProperty(k) && proto[k] === undefined) this[k] = opts[k];
		}
	}, base = Object,
		proto = klass.prototype = Object.create(base.prototype, {
			constructor: {
				value: klass
			}
		});

	// PROTOTYPE MEMBERS
	proto.isDocumentOk =
		proto.isTopLevel =
		proto.isInclusionOk = undefined;

	return klass;
})();

proto.removeFieldPrefix = function removeFieldPrefix(prefixedField) {
	if (prefixedField.indexOf("\0") !== -1) {
		// field path must not contain embedded null characters - 16419
	}
	if (prefixedField[0] !== '$') {
		// "field path references must be prefixed with a '$'"
	}
	return prefixedField.slice(1);
};
var KIND_UNKNOWN = 0,
	KIND_NOTOPERATOR = 1,
	KIND_OPERATOR = 2;
/**
 * Parse an Object.  The object could represent a functional expression or a Document expression.
 *
 * An object expression can take any of the following forms:
 *
 *      f0: {f1: ..., f2: ..., f3: ...}
 *      f0: {$operator:[operand1, operand2, ...]}
 *
 * @static
 * @method parseObject
 * @param obj   the element representing the object
 * @param ctx   a MiniCtx representing the options above
 * @returns the parsed Expression
 **/
klass.parseObject = function parseObject(obj, ctx, vps) {
	if (!(ctx instanceof ObjectCtx)) throw new Error("ctx must be ObjectCtx");
	var kind = KIND_UNKNOWN,
		pExpression, // the result
		pExpressionObject; // the alt result
	if (obj === undefined || obj == {}) return new ObjectExpression();
	var fieldNames = Object.keys(obj);
	if (fieldNames.length === 0) { //NOTE: Added this for mongo 2.5 port of document sources. Should reconsider when porting the expressions themselves
		return new ObjectExpression();
	}
	for (var fieldCount = 0, n = fieldNames.length; fieldCount < n; ++fieldCount) {
		var pFieldName = fieldNames[fieldCount];

		if (pFieldName[0] === "$") {
			if (fieldCount !== 0)
				throw new Error("the operator must be the only field in a pipeline object (at '" + pFieldName + "'.; code 16410");

			if (ctx.isTopLevel)
				throw new Error("$expressions are not allowed at the top-level of $project; code 16404");
			kind = KIND_OPERATOR; //we've determined this "object" is an operator expression
			pExpression = Expression.parseExpression(pFieldName, obj[pFieldName], vps);
		} else {
			if (kind === KIND_OPERATOR)
				throw new Error("this object is already an operator expression, and can't be used as a document expression (at '" + pFieldName + "'.; code 15990");

			if (!ctx.isTopLevel && pFieldName.indexOf(".") != -1)
				throw new Error("dotted field names are only allowed at the top level; code 16405");
			if (pExpression === undefined) { // if it's our first time, create the document expression
				if (!ctx.isDocumentOk)
					throw new Error("document not allowed in this context"); // CW TODO error: document not allowed in this context
				pExpression = pExpressionObject = new ObjectExpression(); //check for top level?
				kind = KIND_NOTOPERATOR; //this "object" is not an operator expression
			}
			var fieldValue = obj[pFieldName];
			switch (typeof(fieldValue)) {
				case "object":
					// it's a nested document
					var subCtx = new ObjectCtx({
						isDocumentOk: ctx.isDocumentOk,
						isInclusionOk: ctx.isInclusionOk
					});
					pExpressionObject.addField(pFieldName, Expression.parseObject(fieldValue, subCtx, vps));
					break;
				case "string":
					// it's a renamed field         // CW TODO could also be a constant
					var pathExpr = new FieldPathExpression.parse(fieldValue);
					pExpressionObject.addField(pFieldName, pathExpr);
					break;
				case "boolean":
				case "number":
					// it's an inclusion specification
					if (fieldValue) {
						if (!ctx.isInclusionOk)
							throw new Error("field inclusion is not allowed inside of $expressions; code 16420");
						pExpressionObject.includePath(pFieldName);
					} else {
						if (!(ctx.isTopLevel && fn == Document.ID_PROPERTY_NAME))
							throw new Error("The top-level " + Document.ID_PROPERTY_NAME + " field is the only field currently supported for exclusion; code 16406");
						pExpressionObject.excludeId = true;
					}
					break;
				default:
					throw new Error("disallowed field type " + (fieldValue ? fieldValue.constructor.name + ":" : "") + typeof(fieldValue) + " in object expression (at '" + pFieldName + "')");
			}
		}
	}
	return pExpression;
};


klass.expressionParserMap = {};

klass.registerExpression = function registerExpression(key, parserFunc) {
	if (key in klass.expressionParserMap) {
		throw new Error("Duplicate expression registrarion for " + key);
	}
	klass.expressionParserMap[key] = parserFunc;
	return 0; // Should
};

/**
 * Parse a BSONElement Object which has already been determined to be functional expression.
 *
 * @static
 * @method parseExpression
 * @param opName        the name of the (prefix) operator
 * @param obj   the BSONElement to parse
 * @returns the parsed Expression
 **/
klass.parseExpression = function parseExpression(exprKey, exprValue, vps) {
	if (!(exprKey in Expression.expressionParserMap)) {
		throw new Error("Invalid operator : " + exprKey);
	}
	return Expression.expressionParserMap[exprKey](exprValue, vps);
};

/**
 * Parse a BSONElement which is an operand in an Expression.
 *
 * @static
 * @param pBsonElement the expected operand's BSONElement
 * @returns the parsed operand, as an Expression
 **/
klass.parseOperand = function parseOperand(exprElement, vps) {
	var t = typeof(exprElement);
	if (t === "string" && exprElement[0] == "$") { //if we got here, this is a field path expression
	    return new FieldPathExpression.parse(exprElement, vps);
	} else
	if (t === "object" && exprElement && exprElement.constructor === Object)
		return Expression.parseObject(exprElement, new ObjectCtx({
			isDocumentOk: true
		}), vps);
	else return ConstantExpression.parse(exprElement, vps);
};

/**
 * Produce a field path string with the field prefix removed.
 * Throws an error if the field prefix is not present.
 *
 * @static
 * @param prefixedField the prefixed field
 * @returns the field path with the prefix removed
 **/
klass.removeFieldPrefix = function removeFieldPrefix(prefixedField) {
	if (prefixedField.indexOf("\0") != -1) throw new Error("field path must not contain embedded null characters; code 16419");
	if (prefixedField[0] !== "$") throw new Error("field path references must be prefixed with a '$' ('" + prefixedField + "'); code 15982");
	return prefixedField.substr(1);
};


// PROTOTYPE MEMBERS
/**
 * Evaluate the Expression using the given document as input.
 *
 * @method evaluate
 * @returns the computed value
 **/
proto.evaluateInternal = function evaluateInternal(obj) {
	throw new Error("WAS NOT IMPLEMENTED BY INHERITOR!");
};

/**
 * Optimize the Expression.
 *
 * This provides an opportunity to do constant folding, or to collapse nested
 *  operators that have the same precedence, such as $add, $and, or $or.
 *
 * The Expression should be replaced with the return value, which may or may
 *  not be the same object.  In the case of constant folding, a computed
 *  expression may be replaced by a constant.
 *
 * @method optimize
 * @returns the optimized Expression
 **/
proto.optimize = function optimize() {
	throw new Error("WAS NOT IMPLEMENTED BY INHERITOR!");
};

/**
 * Add this expression's field dependencies to the set Expressions are trees, so this is often recursive.
 *
 * Top-level ExpressionObject gets pointer to empty vector.
 * If any other Expression is an ancestor, or in other cases where {a:1} inclusion objects aren't allowed, they get NULL.
 *
 * @method addDependencies
 * @param deps  output parameter
 * @param path  path to self if all ancestors are ExpressionObjects.
 **/
proto.addDependencies = function addDependencies(deps, path) {
	throw new Error("WAS NOT IMPLEMENTED BY INHERITOR!");
};

/**
 * simple expressions are just inclusion exclusion as supported by ExpressionObject
 * @method getIsSimple
 **/
proto.getIsSimple = function getIsSimple() {
	return false;
};

proto.toMatcherBson = function toMatcherBson() {
	throw new Error("WAS NOT IMPLEMENTED BY INHERITOR!"); //verify(false && "Expression::toMatcherBson()");
};


// DEPENDENCIES
var Document = require("../Document");
var ObjectExpression = require("./ObjectExpression");
var FieldPathExpression = require("./FieldPathExpression");
var ConstantExpression = require("./ConstantExpression");
