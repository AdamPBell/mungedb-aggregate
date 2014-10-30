"use strict";

var DocumentSource = require('./DocumentSource');

/**
 * A base class for filter document sources
 * @class ProjectDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [ctx] {ExpressionContext}
 **/
var ProjectDocumentSource = module.exports = function ProjectDocumentSource(ctx){
	if (arguments.length > 1) throw new Error("up to one arg expected");
	base.call(this, ctx);
	this.OE = new ObjectExpression();
	this._raw = undefined;
}, klass = ProjectDocumentSource, base = require('./DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Expression = require('../expressions/Expression'),
	ObjectExpression = require('../expressions/ObjectExpression'),
	Value = require('../Value'),
	Variables = require('../expressions/Variables'),
	VariablesIdGenerator = require('../expressions/VariablesIdGenerator'),
	VariablesParseState = require('../expressions/VariablesParseState');

klass.projectName = "$project";

/**
 * Returns the name of project
 * @return {string} the name of project
 **/
proto.getSourceName = function getSourceName() {
	return klass.projectName;
};

proto.getNext = function getNext(callback) {
	if (!callback) throw new Error(this.getSourceName() + ' #getNext() requires callback');

	var self = this,
		out;

	this.source.getNext(function(err, input) {
		if (err)
			return callback(null, err);

		if (input === DocumentSource.EOF) {
			out = input;
			return callback(null, DocumentSource.EOF);
		}

		/* create the result document */
		out = {};

		/**
		 * Use the ExpressionObject to create the base result.
		 *
		 * If we're excluding fields at the top level, leave out the _id if
		 * it is found, because we took care of it above.
		 **/
		self._variables.setRoot(input);
		self.OE.addToDocument(out, input, self._variables);
		self._variables.clearRoot();

		return callback(null, out);
	});
	return out;
};

/**
 * Returns the object that was used to construct the ProjectDocumentSource
 * @return {object} the object that was used to construct the ProjectDocumentSource
 **/
proto.getRaw = function getRaw() {
	return this._raw;
};

proto.serialize = function serialize(explain) {
	var out = {};
	out[this.getSourceName()] = this.OE.serialize(explain);
	return out;
};

/**
 * Optimizes the internal ObjectExpression
 * @return
 **/
proto.optimize = function optimize() {
	this.OE.optimize();
};

proto.toJSON = function toJSON(){
	var obj = {};
	this.sourceToJson(obj);
	return obj;
};

/**
 * Places a $project key inside the builder object with value of this.OE
 * @method sourceToJson
 * @param {builder} An object (was ported from BsonBuilder)
 * @return
 **/
proto.sourceToJson = function sourceToJson(builder, explain) {
	var insides = this.OE.toJSON(true);
	builder[this.getSourceName()] = insides;
};

/**
 * Builds a new ProjectDocumentSource from an object
 * @method createFromJson
 * @return {ProjectDocmentSource} a ProjectDocumentSource instance
 **/
klass.createFromJson = function(jsonElement, expCtx) {
	if (!(jsonElement instanceof Object) || jsonElement.constructor !== Object) throw new Error('Error 15969. Specification must be an object but was ' + typeof jsonElement);

	var objectContext = new Expression.ObjectCtx({
		isDocumentOk: true,
		isTopLevel: true,
		isInclusionOk: true
	});

	var project = new ProjectDocumentSource(expCtx),
		idGenerator = new VariablesIdGenerator(),
		vps = new VariablesParseState(idGenerator);

	project._raw = jsonElement;
	var parsed = Expression.parseObject(jsonElement, objectContext, vps);
	var exprObj = parsed;
	if (!exprObj instanceof ObjectExpression) throw new Error("16402, parseObject() returned wrong type of Expression");
	if (!exprObj.getFieldCount()) throw new Error("16403, $projection requires at least one output field");
	project.OE = exprObj;
	project._variables = new Variables(idGenerator.getIdCount());
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
	return base.GetDepsReturn.EXHAUSTIVE;
};
