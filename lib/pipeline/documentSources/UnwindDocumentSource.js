"use strict";

var async = require("async");

/**
 * A document source unwinder
 * @class UnwindDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [ctx] {ExpressionContext}
 **/
var UnwindDocumentSource = module.exports = function UnwindDocumentSource(ctx){
	if (arguments.length > 1) throw new Error("up to one arg expected");
	base.call(this, ctx);

	// Configuration state.
	this._unwindPath = null;

	// Iteration state.
	this._unwinder = null;

}, klass = UnwindDocumentSource, base = require('./DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var DocumentSource = base,
	FieldPath = require('../FieldPath'),
	Document = require('../Document'),
	Expression = require('../expressions/Expression');

klass.Unwinder = (function(){
	/**
	 * Helper class to unwind arrays within a series of documents.
	 * @param	{String}	unwindPath is the field path to the array to unwind.
	 **/
	var klass = function Unwinder(unwindPath){
		// Path to the array to unwind.
		this._unwindPath = unwindPath;
		// The souce document to unwind.
		this._document = null;
		// Document indexes of the field path components.
		this._unwindPathFieldIndexes = [];
		// Iterator over the array within _document to unwind.
		this._unwindArrayIterator = null;
		// The last value returned from _unwindArrayIterator.
		//this._unwindArrayIteratorCurrent = undefined; //dont define this yet
	}, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

	/**
	 * Reset the unwinder to unwind a new document.
	 * @param	{Object}	document
	 **/
	proto.resetDocument = function resetDocument(document){
		if (!document) throw new Error("document is required!");

		// Reset document specific attributes.
		this._document = document;
		this._unwindPathFieldIndexes.length = 0;
		this._unwindArrayIterator = null;
		delete this._unwindArrayIteratorCurrent;

		var pathValue = this.extractUnwindValue(); // sets _unwindPathFieldIndexes
		if (!pathValue || pathValue.length === 0) return;  // The path does not exist.

		if (!(pathValue instanceof Array)) throw new Error(UnwindDocumentSource.unwindName + ":  value at end of field path must be an array; code 15978");

		// Start the iterator used to unwind the array.
		this._unwindArrayIterator = pathValue.slice(0);
		this._unwindArrayIteratorCurrent = this._unwindArrayIterator.splice(0,1)[0];
	};

	/**
	 * getNext
	 *
	 * This is just wrapping the old functions because they are somewhat different
	 * than the original mongo implementation, but should get updated to follow the current API.
	 **/
	proto.getNext = function getNext() {
		if (this.eof())
			return DocumentSource.EOF;

		var output = this.getCurrent();
		this.advance();
		return output;
	};

	/**
	 * eof
	 * @returns	{Boolean}	true if done unwinding the last document passed to resetDocument().
	 **/
	proto.eof = function eof(){
		return !this.hasOwnProperty("_unwindArrayIteratorCurrent");
	};

	/**
	 * Try to advance to the next document unwound from the document passed to resetDocument().
	 * @returns	{Boolean} true if advanced to a new unwound document, but false if done advancing.
	 **/
	proto.advance = function advance(){
		if (!this._unwindArrayIterator) {
			// resetDocument() has not been called or the supplied document had no results to
			// unwind.
			delete this._unwindArrayIteratorCurrent;
		} else if (!this._unwindArrayIterator.length) {
			// There are no more results to unwind.
			delete this._unwindArrayIteratorCurrent;
		} else {
			this._unwindArrayIteratorCurrent = this._unwindArrayIterator.splice(0, 1)[0];
		}
	};

	/**
	 * Get the current document unwound from the document provided to resetDocument(), using
	 * the current value in the array located at the provided unwindPath.  But return
	 * intrusive_ptr<Document>() if resetDocument() has not been called or the results to unwind
	 * have been exhausted.
	 *
	 * @returns	{Object}
	 **/
	proto.getCurrent = function getCurrent(){
		if (!this.hasOwnProperty("_unwindArrayIteratorCurrent")) {
			return null;
		}

		// Clone all the documents along the field path so that the end values are not shared across
		// documents that have come out of this pipeline operator.  This is a partial deep clone.
		// Because the value at the end will be replaced, everything along the path leading to that
		// will be replaced in order not to share that change with any other clones (or the
		// original).

		var clone = Document.clone(this._document);
		var current = clone;
		var n = this._unwindPathFieldIndexes.length;
		if (!n) throw new Error("unwindFieldPathIndexes are empty");
		for (var i = 0; i < n; ++i) {
			var fi = this._unwindPathFieldIndexes[i];
			var fp = current[fi];
			if (i + 1 < n) {
				// For every object in the path but the last, clone it and continue on down.
				var next = Document.clone(fp);
				current[fi] = next;
				current = next;
			} else {
				// In the last nested document, subsitute the current unwound value.
				current[fi] = this._unwindArrayIteratorCurrent;
			}
		}

		return clone;
	};

	/**
	 * Get the value at the unwind path, otherwise an empty pointer if no such value
	 * exists.  The _unwindPathFieldIndexes attribute will be set as the field path is traversed
	 * to find the value to unwind.
	 *
	 * @returns	{Object}
	 **/
	proto.extractUnwindValue = function extractUnwindValue() {
		var current = this._document;
		var pathValue;
		var pathLength = this._unwindPath.getPathLength();
		for (var i = 0; i < pathLength; ++i) {

			var idx = this._unwindPath.getFieldName(i);

			if (!current.hasOwnProperty(idx)) return null; // The target field is missing.

			// Record the indexes of the fields down the field path in order to quickly replace them
			// as the documents along the field path are cloned.
			this._unwindPathFieldIndexes.push(idx);

			pathValue = current[idx];

			if (i < pathLength - 1) {
				if (typeof pathValue !== 'object') return null; // The next field in the path cannot exist (inside a non object).
				current = pathValue; // Move down the object tree.
			}
		}

		return pathValue;
	};

	return klass;
})();

/**
 * Specify the field to unwind.
**/
proto.unwindPath = function unwindPath(fieldPath){
	// Can't set more than one unwind path.
	if (this._unwindPath) throw new Error(this.getSourceName() + " can't unwind more than one path; code 15979");

	// Record the unwind path.
	this._unwindPath = new FieldPath(fieldPath);
	this._unwinder = new klass.Unwinder(this._unwindPath);
};

klass.unwindName = "$unwind";

proto.getSourceName = function getSourceName(){
	return klass.unwindName;
};

/**
 * Get the fields this operation needs to do its job.
 * Deps should be in "a.b.c" notation
 *
 * @method	getDependencies
 * @param	{Object} deps	set (unique array) of strings
 * @returns	DocumentSource.GetDepsReturn
**/
proto.getDependencies = function getDependencies(deps) {
	if (!this._unwindPath) throw new Error("unwind path does not exist!");
	deps[this._unwindPath.getPath(false)] = 1;
	return DocumentSource.GetDepsReturn.SEE_NEXT;
};

proto.getNext = function getNext(callback) {
	if (!callback) throw new Error(this.getSourceName() + ' #getNext() requires callback');

	var self = this,
		out = this._unwinder.getNext(),
		exhausted = false;

	async.until(
		function() {
			if(out === DocumentSource.EOF && exhausted) return true;	// Really is EOF, not just an empty unwinder
			else if(out !== DocumentSource.EOF) return true; // Return whatever we got that wasn't EOF
			return false;
		},
		function(cb) {
			self.source.getNext(function(err, doc) {
				if(err) return cb(err);
				out = doc;
				if(out === DocumentSource.EOF) { // Our source is out of documents, we're done
					exhausted = true;
					return cb();
				} else {
					self._unwinder.resetDocument(doc);
					out = self._unwinder.getNext();
					return cb();
				}
			});
		},
		function(err) {
			if(err) return callback(err);
			return callback(null, out);
		}
	);

	return out; //For sync mode
};

proto.serialize = function serialize(explain) {
	if (!this._unwindPath) throw new Error("unwind path does not exist!");
	var doc = {};
	doc[this.getSourceName()] = this._unwindPath.getPath(true);
	return doc;
};

/**
 * Creates a new UnwindDocumentSource with the input path as the path to unwind
 * @param {String} JsonElement this thing is *called* Json, but it expects a string
**/
klass.createFromJson = function createFromJson(jsonElement, ctx) {
	// The value of $unwind should just be a field path.
	if (jsonElement.constructor !== String) throw new Error("the " + klass.unwindName + " field path must be specified as a string; code 15981");

	var pathString = Expression.removeFieldPrefix(jsonElement);
	var unwind = new UnwindDocumentSource(ctx);
	unwind.unwindPath(pathString);

	return unwind;
};
