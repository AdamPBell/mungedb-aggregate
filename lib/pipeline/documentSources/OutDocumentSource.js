"use strict";

var DocumentSource = require('./DocumentSource');

/**
 * @class OutDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [ctx] {ExpressionContext}
 **/
var OutDocumentSource = module.exports = function OutDocumentSource(outputNs, ctx){
	if (arguments.length > 2) throw new Error("up to two arg expected");
	base.call(this, ctx);
	// defaults
	this._done = false;
	this._outputNs = outputNs;
	this._collectionName = "";
}, klass = OutDocumentSource, base = require('./DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.outName = "$out";

proto.getSourceName = function() {
	return klass.outName;
};

proto.getNext = DocumentSource.GET_NEXT_PASS_THROUGH;

proto.serialize = function(explain) {
	var doc = {},
		srcNm = this.getSourceName();
	doc[srcNm] = this._collectionName;
	return doc;
};

proto.getOutputNs = function() {
	return this._outputNs;
};

klass.createFromJson = function(jsonElement, ctx) {
	if (typeof jsonElement !== 'string')
		throw new Error('code 16990; $out only supports a string argument, not ' + typeof jsonElement);

	var out = new OutDocumentSource(null, ctx); // TODO: outputNs
	out._collectionName = jsonElement;

	return out;
};

proto.getDependencies = function(deps) {
	deps.needWholeDocument = true;
	return DocumentSource.GetDepsReturn.EXHAUSTIVE;
};
