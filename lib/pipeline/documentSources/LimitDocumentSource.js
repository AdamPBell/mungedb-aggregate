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
var LimitDocumentSource = module.exports = function LimitDocumentSource(ctx, limit){
	if (arguments.length > 2) throw new Error("up to two args expected");
	base.call(this, ctx);
	this.limit = limit;
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

/* Returns the execution of the callback against
* the next documentSource
* @param {function} callback
* @return {bool} indicating end of document reached
*/
proto.getNext = function getNext(callback) {
	if (!callback) throw new Error(this.getSourceName() + ' #getNext() requires callback');

	if (this.expCtx instanceof Object && this.expCtx.checkForInterrupt && this.expCtx.checkForInterrupt() === false)
		return callback(new Error("Interrupted"));

	if (++this.count > this.limit) {
		this.source.dispose();
		callback(null, DocumentSource.EOF);
		return DocumentSource.EOF;
	}

	return this.source.getNext(callback);
};

/**
Create a limiting DocumentSource from JSON.

This is a convenience method that uses the above, and operates on
a JSONElement that has been deteremined to be an Object with an
element named $limit.

@param jsonElement the JSONELement that defines the limit
@param ctx the expression context
@returns the grouping DocumentSource
*/
klass.createFromJson = function createFromJson(jsonElement, ctx) {
	if (typeof jsonElement !== "number") throw new Error("code 15957; the limit must be specified as a number");
	var limit = jsonElement;
	return this.create(ctx, limit);
};

klass.create = function create(ctx, limit){
	if ((limit <= 0) || isNaN(limit)) throw new Error("code 15958; the limit must be positive");
	return new LimitDocumentSource(ctx, limit);
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
