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
 */
var Expression = module.exports = function Expression() {
	if (arguments.length !== 0) throw new Error("zero args expected");
}, klass = Expression, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});


var Value = require("../Value"),
	Document = require("../Document");


/**
 * Reference to the `mungedb-aggregate.pipeline.expressions.Expression.ObjectCtx` class
 * @static
 * @property ObjectCtx
 */
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
	 */
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


/**
 * Produce a field path string with the field prefix removed.
 * Throws an error if the field prefix is not present.
 *
 * @static
 * @param prefixedField the prefixed field
 * @returns the field path with the prefix removed
 **/
klass.removeFieldPrefix = function removeFieldPrefix(prefixedField) {
	if (prefixedField.indexOf("\0") != -1) throw new Error("field path must not contain embedded null characters; uassert code 16419");
	if (prefixedField[0] !== "$") throw new Error("field path references must be prefixed with a '$' ('" + prefixedField + "'); uassert code 15982");
	return prefixedField.substr(1);
};


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
 * @param vps	Variables Parse State
 * @returns the parsed Expression
 */
klass.parseObject = function parseObject(obj, ctx, vps) {
	if (!(ctx instanceof ObjectCtx)) throw new Error("ctx must be ObjectCtx");

	var expression, // the result
		expressionObject, // the alt result
		UNKNOWN = 0,
		NOTOPERATOR = 1,
		OPERATOR = 2,
		kind = UNKNOWN;

	if (obj === undefined || obj === null || (obj instanceof Object && Object.keys(obj).length === 0)) return new ObjectExpression();
	var fieldNames = Object.keys(obj);
	for (var fieldCount = 0, n = fieldNames.length; fieldCount < n; ++fieldCount) {
		var fieldName = fieldNames[fieldCount];

		if (fieldName[0] === "$") {
			if (fieldCount !== 0)
				throw new Error("the operator must be the only field in a pipeline object (at '" + fieldName + "'.; uassert code 15983");

			if (ctx.isTopLevel)
				throw new Error("$expressions are not allowed at the top-level of $project; uassert code 16404");

			// we've determined this "object" is an operator expression
			kind = OPERATOR;

			expression = Expression.parseExpression(fieldName, obj[fieldName], vps); //NOTE: DEVIATION FROM MONGO: c++ code uses 2 arguments. See #parseExpression
		} else {
			if (kind === OPERATOR)
				throw new Error("this object is already an operator expression, and can't be used as a document expression (at '" + fieldName + "'.; uassert code 15990");

			if (!ctx.isTopLevel && fieldName.indexOf(".") !== -1)
				throw new Error("dotted field names are only allowed at the top level; uassert code 16405");

			// if it's our first time, create the document expression
			if (expression === undefined) {
				if (!ctx.isDocumentOk) throw new Error("Assertion failure");
				// CW TODO error: document not allowed in this context

				expressionObject = ctx.isTopLevel ? ObjectExpression.createRoot() : ObjectExpression.create();
				expression = expressionObject;

				// this "object" is not an operator expression
				kind = NOTOPERATOR;
			}

			var fieldValue = obj[fieldName];
			switch (typeof(fieldValue)) {
				case "object":
					// it's a nested document
					var subCtx = new ObjectCtx({
						isDocumentOk: ctx.isDocumentOk,
						isInclusionOk: ctx.isInclusionOk
					});

					expressionObject.addField(fieldName, Expression.parseObject(fieldValue, subCtx, vps));

					break;
				case "string":
					// it's a renamed field
					// CW TODO could also be a constant
					expressionObject.addField(fieldName, FieldPathExpression.parse(fieldValue, vps));
					break;
				case "boolean":
				case "number":
					// it's an inclusion specification
					if (fieldValue) {
						if (!ctx.isInclusionOk)
							throw new Error("field inclusion is not allowed inside of $expressions; uassert code 16420");
						expressionObject.includePath(fieldName);
					} else {
						if (!(ctx.isTopLevel && fieldName === Document.ID_PROPERTY_NAME))
							throw new Error("The top-level " + Document.ID_PROPERTY_NAME + " field is the only field currently supported for exclusion; uassert code 16406");
						expressionObject.excludeId = true;
					}
					break;
				default:
					throw new Error("disallowed field type " + Value.getType(fieldValue) + " in object expression (at '" + fieldName + "') uassert code 15992");
			}
		}
	}

	return expression;
};


klass.expressionParserMap = {};


/**
 * Registers an ExpressionParser so it can be called from parseExpression and friends.
 * As an example, if your expression looks like {"$foo": [1,2,3]} you would add this line:
 * REGISTER_EXPRESSION("$foo", ExpressionFoo::parse);
 */
klass.registerExpression = function registerExpression(key, parserFunc) {
	if (key in klass.expressionParserMap) {
		throw new Error("Duplicate expression (" + key + ") detected; massert code 17064");
	}
	klass.expressionParserMap[key] = parserFunc;
	return 1;
};


/**
 * Parses a BSONElement which has already been determined to be functional expression.
 * @static
 * @method parseExpression
 * @param exprElement should be the only element inside the expression object.
 *    That is the field name should be the $op for the expression.
 * @param vps the variable parse state
 * @returns the parsed Expression
 */
//NOTE: DEVIATION FROM MONGO: the c++ version has 2 arguments, not 3.	//TODO: could easily fix this inconsistency
klass.parseExpression = function parseExpression(exprElementKey, exprElementValue, vps) {
	if (!(exprElementKey in Expression.expressionParserMap)) {
		throw new Error("Invalid operator : " + exprElementKey + "; code 15999");
	}
	return Expression.expressionParserMap[exprElementKey](exprElementValue, vps);
};


/**
 * Parses a BSONElement which is an operand in an Expression.
 *
 * This is the most generic parser and can parse ExpressionFieldPath, a literal, or a $op.
 * If it is a $op, exprElement should be the outer element whose value is an Object
 * containing the $op.
 *
 * @method parseOperand
 * @static
 * @param exprElement should be the only element inside the expression object.
 *    That is the field name should be the $op for the expression.
 * @param vps the variable parse state
 * @returns the parsed operand, as an Expression
 */
klass.parseOperand = function parseOperand(exprElement, vps) {
	var t = typeof(exprElement);
	if (t === "string" && exprElement[0] == "$") { //if we got here, this is a field path expression
	    return new FieldPathExpression.parse(exprElement, vps);
	} else if (t === "object" && exprElement && exprElement.constructor === Object) {
		return Expression.parseObject(exprElement, new ObjectCtx({
			isDocumentOk: true
		}), vps);
	} else {
		return ConstantExpression.parse(exprElement, vps);
	}
};


/**
 * Evaluate the Expression using the given document as input.
 *
 * @method evaluate
 * @returns the computed value
 */
proto.evaluateInternal = function evaluateInternal(obj) {
	throw new Error("WAS NOT IMPLEMENTED BY INHERITOR!");
};


/**
 * Evaluate expression with specified inputs and return result.
 *
 * While vars is non-const, if properly constructed, subexpressions modifications to it
 * should not effect outer expressions due to unique variable Ids.
 */
proto.evaluate = function evaluate(vars) {
	return this.evaluateInternal(vars);
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
 */
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
 */
proto.addDependencies = function addDependencies(deps, path) {
	throw new Error("WAS NOT IMPLEMENTED BY INHERITOR!");
};

/**
 * simple expressions are just inclusion exclusion as supported by ExpressionObject
 * @method getIsSimple
 */
proto.getIsSimple = function getIsSimple() {
	return false;
};


proto.toMatcherBson = function toMatcherBson() {
	throw new Error("WAS NOT IMPLEMENTED BY INHERITOR!"); //verify(false && "Expression::toMatcherBson()");
};


var ObjectExpression = require("./ObjectExpression"),
	FieldPathExpression = require("./FieldPathExpression"),
	ConstantExpression = require("./ConstantExpression");
