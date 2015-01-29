"use strict";

var async = require("async"),
	DocumentSource = require("./DocumentSource");

/**
 * A document source skipper.
 *
 * @class SkipDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [ctx] {ExpressionContext}
 **/
var SkipDocumentSource = module.exports = function SkipDocumentSource(ctx) {
	if (arguments.length > 1) {
		throw new Error("Up to one argument expected.");
	}

	base.call(this, ctx);

	this.skip = 0;
	this.count = 0;

	this.needToSkip = true;
}, klass = SkipDocumentSource, base = require("./DocumentSource"), proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}}); //jshint ignore:line

klass.skipName = "$skip";

/**
 * Return the source name.
 *
 * @returns {string}
 */
proto.getSourceName = function getSourceName() {
	return klass.skipName;
};

/**
 * Coalesce skips together.
 *
 * @param nextSource
 * @returns {boolean}
 */
proto.coalesce = function coalesce(nextSource) {
	var nextSkip =	nextSource.constructor === SkipDocumentSource ? nextSource : null;

	// If it's not another $skip, we can't coalesce.
	if (!nextSkip) {
		return false;
	}

	// We need to skip over the sum of the two consecutive $skips.
	this.skip += nextSkip.skip;

	return true;
};

/**
 * Returns the next Documnet if there is one or null if at EOF
 * @method getNext
 */
proto.getNext = function getNext() {
	if (this.expCtx && this.expCtx.checkForInterrupt) this.expCtx.checkForInterrupt();

	if (this.needToSkip) {
		this.needToSkip = false;
		for (var i = 0; i < this._skip; i++) {
			if (!this.source.getNext())
				return null;
		}
	}

	return this.source.getNext();
};

/**
 * Serialize the source.
 *
 * @param explain
 * @returns {{}}
 */
proto.serialize = function serialize(explain) {
	var out = {};

	out[this.getSourceName()] = this.skip;

	return out;
};

/**
 * Get skip value.
 *
 * @returns {number}
 */
proto.getSkip = function getSkip() {
	return this.skip;
};

/**
 * Set skip value.
 *
 * @param newSkip
 */
proto.setSkip = function setSkip(newSkip) {
	this.skip = newSkip;
};

/**
 * Create a new SkipDocumentSource.
 *
 * @param expCtx
 * @returns {SkipDocumentSource}
 */
klass.create = function create(expCtx) {
	return new SkipDocumentSource(expCtx);
};

/**
 * Creates a new SkipDocumentSource with the input number as the skip.
 *
 * @param {Number} JsonElement this thing is *called* JSON, but it expects a number.
 **/
klass.createFromJson = function createFromJson(jsonElement, ctx) {
	if (typeof jsonElement !== "number") {
		throw new Error("code 15972; the value to skip must be a number");
	}

	var nextSkip = new SkipDocumentSource(ctx);

	nextSkip.skip = jsonElement;

	if (nextSkip.skip < 0 || isNaN(nextSkip.skip)) {
		throw new Error("code 15956; the number to skip cannot be negative");
	}

	return nextSkip;
};

// SplittableDocumentSource implementation.
klass.isSplittableDocumentSource = true;

/**
 * Get dependencies.
 *
 * @param deps
 * @returns {number}
 */
proto.getDependencies = function getDependencies(deps) {
	return DocumentSource.GetDepsReturn.SEE_NEXT;
};

/**
 * Get shard source.
 *
 * @returns {null}
 */
proto.getShardSource = function getShardSource() {
	return null;
};

/**
 * Get router source.
 *
 * @returns {SkipDocumentSource}
 */
proto.getRouterSource = function getRouterSource() {
	return this;
};
