"use strict";

var async = require('async'),
	DocumentSource = require('./DocumentSource'),
	FieldPath = require('../FieldPath');

/**
 * @class GeoNearDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [ctx] {ExpressionContext}
 **/
var GeoNearDocumentSource = module.exports = function GeoNearDocumentSource(ctx) {
	if (arguments.length > 1) throw new Error("up to one arg expected");
	base.call(this, ctx);
	// mongo defaults
	this.coordsIsArray = false;
	this.limit = 100;
	this.maxDistance = -1.0;
	this.spherical = false;
	this.distanceMultiplier = 1.0;
	this.uniqueDocs = true;
}, klass = GeoNearDocumentSource, base = require('./DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.geoNearName = "$geoNear";

klass.create = function create(expCtx) {
	return new GeoNearDocumentSource(expCtx);
};

proto.getSourceName = function() {
	return klass.geoNearName;
};

proto.getNext = DocumentSource.GET_NEXT_PASS_THROUGH;

proto.setSource = function(docSource) {
	throw new Error('code 16602; $geoNear is only allowed as the first pipeline stage');
};

proto.isValidInitialSource = function() {
	return true;
};

proto.serialize = function(explain) {
	var result = {};

	if (this.coordsIsArray)
		result.near = this.near;
	else
		result.near = [this.near];

	// not in buildGeoNearCmd
	result.distanceField = this.distanceField.getPath(false);

	result.limit = this.limit;

	if (this.maxDistance > 0)
		result.maxDistance = this.maxDistance;

	if (this.query)
		result.query = this.query;

	if (this.spherical)
		result.spherical = this.spherical;

	if (this.distanceMultiplier)
		result.distanceMultiplier = this.distanceMultiplier;

	if (this.includeLocs) {
		if (typeof this.includeLocs !== 'string')
			throw new Error('code 16607; $geoNear requires that \'includeLocs\' option is a String');
		result.includeLocs = this.includeLocs.getPath(false);
	}

	if (this.uniqueDocs)
		result.uniqueDocs = this.uniqueDocs;

	var sourceName = this.getSourceName(),
		returnObj = {};
	returnObj[sourceName] = result;

	return returnObj;
};

klass.createFromJson = function(jsonElement, ctx) {
	var out = new GeoNearDocumentSource(ctx);
	out.parseOptions(jsonElement);
	return out;
};

proto.parseOptions = function(options) {

	// near and distanceField are required
	if (!options.near || !Array.isArray(options.near))
		throw new Error('code 16605; $geoNear requires a \'near\' option as an Array');
	this.coordsIsArray = options.near instanceof Array;

	if (typeof options.distanceField !== 'string')
		throw new Error('code 16606: $geoNear  a \'distanceNear\' option as a String');
	this.distanceField = new FieldPath(options.distanceField);

	// remaining fields are optional

	// num and limits are synonyms
	if (typeof options.limit === 'number')
		this.limit = options.limit;
	if (typeof options.num === 'number')
		this.limit = options.num;

	if (typeof options.maxDistance === 'number')
		this.maxDistance = options.maxDistance;

	if (options.query instanceof Object)
		this.query = options.query;

	if (options.spherical)
		this.spherical = options.spherical;

	if (typeof options.distanceMultiplier === 'number')
		this.distanceMultiplier = options.distanceMultiplier;

	if (options.includeLocs) {
		if (typeof options.includeLocs !== 'string')
			throw new Error('code 16607; $geoNear requires that \'includeLocs\' option is a String');
		this.includeLocs = new FieldPath(options.includeLocs);
	}

	if (options.uniqueDocs)
		this.uniqueDocs;
};



