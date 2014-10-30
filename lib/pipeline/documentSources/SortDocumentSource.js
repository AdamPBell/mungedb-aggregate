"use strict";

var async = require("async"),
	DocumentSource = require("./DocumentSource"),
	LimitDocumentSource = require("./LimitDocumentSource");

/**
 * A document source sorter
 *
 *	//NOTE: DEVIATION FROM THE MONGO: We don't have shards, this inherits from DocumentSource, instead of SplittableDocumentSource
 *
 * @class SortDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [ctx] {ExpressionContext}
 **/
var SortDocumentSource = module.exports = function SortDocumentSource(ctx){
	if (arguments.length > 1) throw new Error("up to one arg expected");
	base.call(this, ctx);
	/*
	* Before returning anything, this source must fetch everything from
	* the underlying source and group it.  populate() is used to do that
	* on the first call to any method on this source.  The populated
	* boolean indicates that this has been done
	**/
	this.populated = false;
	this.docIterator = null; // a number tracking our position in the documents array
	this.documents = []; // an array of documents

	this.vSortKey = [];
	this.vAscending = [];
}, klass = SortDocumentSource, base = require('./DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var FieldPathExpression = require("../expressions/FieldPathExpression"),
	Value = require("../Value");

klass.sortName = "$sort";

proto.getSourceName = function getSourceName(){
	return klass.sortName;
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

klass.GetDepsReturn = {
	SEE_NEXT: "SEE_NEXT" // Add the next Source's deps to the set
};

proto.dispose = function dispose() {
	this.docIterator = 0;
	this.documents = [];
	this.source.dispose();
};

proto.getLimit = function getLimit() {
	return this.limitSrc ? this.limitSrc.getLimit() : -1;
};

proto.getDependencies = function getDependencies(deps) {
	for(var i = 0; i < this.vSortKey.length; ++i) {
		this.vSortKey[i].addDependencies(deps);
	}
	return klass.GetDepsReturn.SEE_NEXT;
};

proto.coalesce = function coalesce(nextSource) {
	if (!this.limitSrc) {
		if (nextSource instanceof LimitDocumentSource) {
			this.limitSrc = nextSource;
			return nextSource;
		}
		return false;
	} else {
		return this.limitSrc.coalesce(nextSource);
	}
};

proto.getNext = function getNext(callback) {
	if (!callback) throw new Error(this.getSourceName() + ' #getNext() requires callback');

	var self = this,
		out;
	async.series(
		[
			function(next) {
				if (!self.populated)
					self.populate(function(err) {
						return next(err);
					});
				else
					next();
			},
			function(next) {
				if (self.docIterator >= self.documents.length) {
					out = DocumentSource.EOF;
					return next(null, DocumentSource.EOF);
				}

				var output = self.documents[self.docIterator++];
				if (!output || output === DocumentSource.EOF) {
					out = DocumentSource.EOF;
					return next(null, DocumentSource.EOF);
				}

				out = output;
				return next(null, output);
			}
		],
		function(err, results) {
			return callback(err, out);
		}
	);

	return out;
};

proto.serializeToArray = function serializeToArray(array, explain) {
	var doc = {};
	if (explain) {
		doc.sortKey = this.serializeSortKey();
		doc.mergePresorted = this._mergePresorted;
		doc.limit = this.limitSrc ? this.limitSrc.getLimit() : undefined;
		array.push(doc);
	} else {
		var inner = this.serializeSortKey();
		if (this._mergePresorted)
			inner.$mergePresorted = true;
		doc[this.getSourceName()] = inner;
		array.push(doc);

		if (this.limitSrc)
			this.limitSrc.serializeToArray(array);
	}
};

proto.serialize = function serialize(explain) {
	throw new Error("should call serializeToArray instead");
};

/**
* Add sort key field.
*
* Adds a sort key field to the key being built up.  A concatenated
* key is built up by calling this repeatedly.
*
* @param {String} fieldPath the field path to the key component
* @param {bool} ascending if true, use the key for an ascending sort, otherwise, use it for descending
**/
proto.addKey = function addKey(fieldPath, ascending) {
	var pathExpr = new FieldPathExpression(fieldPath);
	this.vSortKey.push(pathExpr);
	if (ascending === true || ascending === false) {
		this.vAscending.push(ascending);
	} else {
		// This doesn't appear to be an error in real mongo?
		throw new Error("ascending must be true or false");
	}
};

proto.populate = function populate(callback) {
	/* make sure we've got a sort key */
	if (!this.vSortKey.length) throw new Error("no sort key for " + this.getSourceName());

	// Skipping stuff about mergeCursors and commandShards

	/* pull everything from the underlying source */
	var self = this,
		next;
	async.doWhilst(
		function (cb) {
			self.source.getNext(function(err, doc) {
				next = doc;

				// Don't add EOF; it doesn't sort well.
				if (doc !== DocumentSource.EOF)
					self.documents.push(doc);
				return cb();
			});
		},
		function() {
			return next !== DocumentSource.EOF;
		},
		function(err) {
	/* sort the list */
			self.documents.sort(SortDocumentSource.prototype.compare.bind(self));

	/* start the sort iterator */
			self.docIterator = 0;

			self.populated = true;
			return callback();
	}
	);
};

/**
 * Compare two documents according to the specified sort key.
 *
 * @param {Object} pL the left side doc
 * @param {Object} pR the right side doc
 * @returns {Number} a number less than, equal to, or greater than zero, indicating pL < pR, pL == pR, or pL > pR, respectively
**/
proto.compare = function compare(pL,pR) {
	/**
	* populate() already checked that there is a non-empty sort key,
	* so we shouldn't have to worry about that here.
	*
	* However, the tricky part is what to do is none of the sort keys are
	* present.  In this case, consider the document less.
	**/
	var n = this.vSortKey.length;
	for(var i = 0; i < n; ++i) {
		/* evaluate the sort keys */
		var pathExpr = new FieldPathExpression(this.vSortKey[i].getFieldPath(false));
		var left = pathExpr.evaluate(pL), right = pathExpr.evaluate(pR);

		/*
		Compare the two values; if they differ, return.  If they are
		the same, move on to the next key.
		*/
		var cmp = Value.compare(left, right);
		if (cmp) {
			/* if necessary, adjust the return value by the key ordering */
			if (!this.vAscending[i])
				cmp = -cmp;
			return cmp;
		}
	}
	/**
	* If we got here, everything matched (or didn't exist), so we'll
	* consider the documents equal for purposes of this sort
	**/
	return 0;
};

/**
* Write out an object whose contents are the sort key.
**/
proto.serializeSortKey = function sortKeyToJson() {
	var keyObj = {};

	var n = this.vSortKey.length;
	for (var i = 0; i < n; i++) {
		var fieldPath = this.vSortKey[i].getFieldPath();
		keyObj[fieldPath] = this.vAscending[i] ? 1 : -1;
	}
	return keyObj;
};

/**
 * Creates a new SortDocumentSource
 * @param {Object} jsonElement
**/
klass.createFromJson = function createFromJson(jsonElement, ctx) {
	if (typeof jsonElement !== "object") throw new Error("code 15973; the " + klass.sortName + " key specification must be an object");

	var Sort = proto.getFactory(),
		nextSort = new Sort(ctx);

	/* check for then iterate over the sort object */
	var sortKeys = 0;
	for(var key in jsonElement) {
		var sortOrder = 0;

		if (typeof jsonElement[key] !== "number") throw new Error("code 15974; " + klass.sortName + " key ordering must be specified using a number");

		sortOrder = jsonElement[key];
		if ((sortOrder != 1) && (sortOrder !== -1)) throw new Error("code 15975; " + klass.sortName + " key ordering must be 1 (for ascending) or 0 (for descending)");

		nextSort.addKey(key, (sortOrder > 0));
		++sortKeys;
	}

	if (sortKeys <= 0) throw new Error("code 15976; " + klass.sortName + " must have at least one sort key");
	return nextSort;
};
