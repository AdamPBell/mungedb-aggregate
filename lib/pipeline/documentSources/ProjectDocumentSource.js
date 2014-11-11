"use strict";

var Expression = require("../expressions/Expression"),
	ObjectExpression = require("../expressions/ObjectExpression"),
	Variables = require("../expressions/Variables"),
	VariablesIdGenerator = require("../expressions/VariablesIdGenerator"),
	VariablesParseState = require("../expressions/VariablesParseState");

/**
 * A base class for filter document sources
 * @class ProjectDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [ctx] {ExpressionContext}
 **/
var ProjectDocumentSource = module.exports = function ProjectDocumentSource(ctx, exprObj){
	if (arguments.length > 2) throw new Error("up to two args expected");
	base.call(this, ctx);
	this.OE = ObjectExpression.create();
	this._raw = undefined;
	this._variables = undefined;
}, klass = ProjectDocumentSource, base = require("./DocumentSource"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

klass.projectName = "$project";

/**
 * Returns the name of project
 * @return {string} the name of project
 **/
proto.getSourceName = function getSourceName() {
	return klass.projectName;
};

proto.getNext = function getNext(callback) {
	if (!callback) throw new Error(this.getSourceName() + " #getNext() requires callback");

	var self = this,
		out;

	this.source.getNext(function(err, input) {
		if (err)
			return callback(null, err);

		if (input === null) {
			out = input;
			return callback(null, null);
		}

		/* create the result document */
		out = {};

		/**
		 * Use the ExpressionObject to create the base result.
		 *
		 * If we're excluding fields at the top level, leave out the _id if
		 * it is found, because we took care of it above.
		 **/
		try {
			self._variables.setRoot(input);
			self.OE.addToDocument(out, input, self._variables);
			self._variables.clearRoot();
		} catch (ex){
			return callback(ex);
		}

		return callback(null, out);
	});
	return out;
};

/**
 * Optimizes the internal ObjectExpression
 * @return
 **/
proto.optimize = function optimize() {
	this.OE = this.OE.optimize();
};

proto.serialize = function serialize(explain) {
	var out = {};
	out[this.getSourceName()] = this.OE.serialize(explain);
	return out;
};

/**
 * Builds a new ProjectDocumentSource from an object
 * @method createFromJson
 * @return {ProjectDocmentSource} a ProjectDocumentSource instance
 **/
klass.createFromJson = function(elem, expCtx) {
	if (!(elem instanceof Object) || elem.constructor !== Object)
		throw new Error("Error 15969. Specification must be an object but was " + typeof elem);

	var objectContext = new Expression.ObjectCtx({
		isDocumentOk: true,
		isTopLevel: true,
		isInclusionOk: true
	});

	var idGenerator = new VariablesIdGenerator(),
		vps = new VariablesParseState(idGenerator),
		parsed = Expression.parseObject(elem, objectContext, vps),
		exprObj = parsed;

	if (!exprObj instanceof ObjectExpression) throw new Error("16402, parseObject() returned wrong type of Expression");
	//if (!exprObj.getFieldCount() ) throw new Error("uassert 16403: $project requires at least one output field");

	var project = new ProjectDocumentSource(expCtx, exprObj);
	project._variables = new Variables(idGenerator.getIdCount());

	var projectObj = elem;
	project._raw = projectObj;

	project.OE = exprObj;

	return project;
};

/**
 *	Adds dependencies to the contained ObjectExpression
 *	@param {deps} An object that is treated as a set of strings
 *	@return A string that is part of the GetDepsReturn enum
 **/
proto.getDependencies = function getDependencies(deps) {
	var path = [];
	this.OE.addDependencies(deps, path);
	return base.GetDepsReturn.EXHAUSTIVE_FIELDS;
};

/**
 * Returns the object that was used to construct the ProjectDocumentSource
 * @return {object} the object that was used to construct the ProjectDocumentSource
 **/
proto.getRaw = function getRaw() {
	return this._raw;
};
