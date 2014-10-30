"use strict";

var DocumentSource = require('./DocumentSource');

/**
 * A document source limiter
 * @class LimitDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [ctx] {ExpressionContext}
 **/
var LimitDocumentSource = module.exports = function LimitDocumentSource(ctx){
	if (arguments.length > 1) throw new Error("up to one arg expected");
	base.call(this, ctx);
	this.limit = 0;
	this.count = 0;
}, klass = LimitDocumentSource, base = require('./DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.limitName = "$limit";

proto.getSourceName = function getSourceName(){
	return klass.limitName;
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

/**
 * Coalesce limits together
 * @param {Object} nextSource the next source
 * @return {bool} return whether we can coalese together
 **/
proto.coalesce = function coalesce(nextSource) {
	var nextLimit =	nextSource.constructor === LimitDocumentSource?nextSource:null;

	// if it's not another $limit, we can't coalesce
	if (!nextLimit) return false;

	// we need to limit by the minimum of the two limits
	if (nextLimit.limit < this.limit) this.limit = nextLimit.limit;

	return true;
};

proto.getNext = function getNext(callback) {
	if (!callback) throw new Error(this.getSourceName() + ' #getNext() requires callback');

	if (++this.count > this.limit) {
		this.source.dispose();
		callback(null, DocumentSource.EOF);
		return DocumentSource.EOF;
	}

	return this.source.getNext(callback);
};

/**
 * Creates a new LimitDocumentSource with the input number as the limit
 * @param {Number} JsonElement this thing is *called* Json, but it expects a number
 **/
klass.createFromJson = function createFromJson(jsonElement, ctx) {
	if (typeof jsonElement !== "number") throw new Error("code 15957; the limit must be specified as a number");

	var Limit = proto.getFactory(),
		nextLimit = new Limit(ctx);

	nextLimit.limit = jsonElement;
	if ((nextLimit.limit <= 0) || isNaN(nextLimit.limit)) throw new Error("code 15958; the limit must be positive");

	return nextLimit;
};

proto.getLimit = function getLimit(newLimit) {
	return this.limit;
};

proto.setLimit = function setLimit(newLimit) {
	this.limit = newLimit;
};

proto.getDependencies = function(deps) {
	return DocumentSource.GetDepsReturn.SEE_NEXT;
};

proto.serialize = function(explain) {
	var out = {};
	out[this.getSourceName()] = this.limit;
	return out;
};
