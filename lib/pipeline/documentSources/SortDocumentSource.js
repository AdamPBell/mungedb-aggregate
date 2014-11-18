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
}, klass = SortDocumentSource, base = require("./DocumentSource"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

// DEPENDENCIES
var FieldPathExpression = require("../expressions/FieldPathExpression"),
	VariablesIdGenerator = require("../expressions/VariablesIdGenerator"),
	VariablesParseState = require("../expressions/VariablesParseState"),
	Variables = require("../expressions/Variables"),
	Value = require("../Value");

klass.sortName = "$sort";

proto.getSourceName = function getSourceName(){
	return klass.sortName;
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

proto.dispose = function dispose() {
	this.docIterator = 0;
	this.documents = [];
	this._output = undefined;
	this.source.dispose();
};

proto.getLimit = function getLimit() {
	return this.limitSrc ? this.limitSrc.getLimit() : -1;
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
	if (!callback) throw new Error(this.getSourceName() + " #getNext() requires callback");

	if (this.expCtx instanceof Object && this.expCtx.checkForInterrupt && this.expCtx.checkForInterrupt() === false)
		return callback(new Error("Interrupted"));

	var self = this,
		out;
	async.series(
		[
			function(next) {
				if (!self.populated)
				{
					self.populate(function(err) {
						return next(err);
					});
				} else {
					return next();
				}
			},
			function(next) {
				if (self.docIterator >= self.documents.length) {
					out = null;
					return next(null, null);
				}

				var output = self.documents[self.docIterator++];
				if (!output || output === null) {
					out = null;
					return next(null, null);
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

/**
* Serialize to Array.
*
* @param {Array} array
* @param {bool} explain
**/
proto.serializeToArray = function serializeToArray(array, explain) {
	var doc = {};
	if (explain) { // always one obj for combined $sort + $limit
		doc.sortKey = this.serializeSortKey(explain);
		doc.mergePresorted = this._mergePresorted;
		doc.limit = this.limitSrc ? this.limitSrc.getLimit() : undefined;
		array.push(doc);
	} else { // one Value for $sort and maybe a Value for $limit
		var inner = {};
		inner = this.serializeSortKey(explain);
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
	var idGenerator = new VariablesIdGenerator(),
		vps = new VariablesParseState(idGenerator);

	var pathExpr = FieldPathExpression.parse("$$ROOT." + fieldPath, vps);
	this.vSortKey.push(pathExpr);
	if (ascending === true || ascending === false) {
		this.vAscending.push(ascending);
	} else {
		// This doesn't appear to be an error in real mongo?
		throw new Error("ascending must be true or false");
	}
};

proto.makeSortOptions = function makeSortOptions(){
	/* make sure we've got a sort key */
	if (!this.vSortKey.length) throw new Error("no sort key for " + this.getSourceName());

	// Skipping memory checks

	var opts;
	if ( this.limitSrc)
		opts.limit = this.limitSrc.getLimt();

	return opts;
};


proto.populate = function populate(callback) {
	if ( this._mergePresorted ){
		// Skipping stuff about mergeCursors and commandShards
		throw new Error("Merge presorted not implemented.");
	} else {
		/* pull everything from the underlying source */
		var self = this,
			next;

		async.doWhilst(
			function (cb) {
				self.source.getNext(function(err, doc) {
					next = doc;

					// Don't add EOF; it doesn't sort well.
					if (doc !== null)
						self.documents.push(doc);

					return cb();
				});
			},
			function() {
				return next !== null;
			},
			function(err) {
				try {
					/* sort the list */
					self.documents.sort(SortDocumentSource.prototype.compare.bind(self));
				} catch (ex) {
					return callback(ex);
				}
				/* start the sort iterator */
				self.docIterator = 0;

				self.populated = true;
				//self._output.reset(true);
				return callback();
		}
		);


	}
	this.populated = true;
};

klass.IteratorFromCursor = (function(){
	/**
	 * Helper class to unwind arrays within a series of documents.
	 * @param	{String}	unwindPath is the field path to the array to unwind.
	 **/
	var klass = function IteratorFromCursor(sorter, cursor){
		this._sorter = new SortDocumentSource(sorter);
		//this._cursor = new DBClientCursor(cursor);

	}, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

	proto.more = function more() {
		return this._cursor.more();
	};

	proto.next = function next() {
		// var doc = new DocumentSourceMergeCursors(this._cursor);
		// TODO: make_pair for return
		//return {this._sorter.extractKey(doc): doc};
	};
	return klass;
})();

proto.populateFromCursors = function populateFromCursors(cursors){
	//TODO: umm, probably broken...
	// for (var i = 0; i < cursors.length; i++) {
	// 	// TODO Create class
	// 	//this.iterators.push(boost::make_shared<IteratorFromBsonArray>(this, cursors[i]));
	// }
	//this._output.reset( ); // TODO: MySorter::Iterator::merge(iterators, makeSortOptions(), Comparator(*this))
	throw new Error("this implementation is broken"); //TODO: fix?
};

klass.IteratorFromBsonArray = (function(){
	/**
	 * Helper class to unwind arrays within a series of documents.
	 * @param	{String}	unwindPath is the field path to the array to unwind.
	 **/
	var klass = function IteratorFromBsonArray(sorter, array){
		this._sorter = new SortDocumentSource(sorter);
		//this._iterator = new BSONObjIterator(array);

	}, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

	proto.next = function next() {
		// var doc = new DocumentSourceMergeCursors(this._cursor);
		// TODO: make_pair for return
		//return {this._sorter.extractKey(doc): doc};
	};

	proto.more = function more() {
		return this._cursor.more();
	};

	return klass;
})();

proto.populateFromBsonArrays = function populateFromBsonArrays(arrays){
	//TODO: umm, probably broken...
	// for (var i = 0; i < arrays.lenth; i++) {
	// 	// TODO Create class
	// 	//this.iterators.push(boost::make_shared<IteratorFromBsonArray>(this, arrays[i]));
	// }
	// this._output.reset( ); // TODO: MySorter::Iterator::merge(iterators, makeSortOptions(), Comparator(*this))
	throw new Error("this implementation is broken"); //TODO: fix?
};

/**
* Extract the key
*
* @param  {d} document
* @returns {keys} extracted key
**/
proto.extractKey = function extractKey(d){
	var vars = new Variables(0,d);

	if ( this.vSortKey.length === 1)
		return this.vSortKey[0].evaluate(vars);

	var keys;
	for (var i=0; i < this.vSortKey.length; i++) {
		keys.push(this.vSortKey[i].evaluate(vars));
	}
	return keys;
};

/**
 * Compare two documents according to the specified sort key.
 *
 * @param {Object} lhs the left side doc
 * @param {Object} rhs the right side doc
 * @returns {Number} a number less than, equal to, or greater than zero, indicating pL < pR, pL == pR, or pL > pR, respectively
**/
proto.compare = function compare(lhs,rhs) {
	/*
	  populate() already checked that there is a non-empty sort key,
	  so we shouldn't have to worry about that here.
	  However, the tricky part is what to do is none of the sort keys are
	  present.  In this case, consider the document less.
	*/

	for(var i = 0, n = this.vSortKey.length; i < n; ++i) {
		var pathExpr = FieldPathExpression.create(this.vSortKey[i].getFieldPath(false).fieldNames.slice(1).join("."));

		/* evaluate the sort keys */
		var left = pathExpr.evaluate(lhs), right = pathExpr.evaluate(rhs);

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
 *
 * @param {bool} explain
 * @return {Object} key
**/
proto.serializeSortKey = function serializeSortKey(explain) {
	var keyObj = {};
	// add the key fields
	var n = this.vSortKey.length;
	for (var i = 0; i < n; i++) {
		if ( this.vSortKey[i] instanceof FieldPathExpression ) {
			var fieldPath = this.vSortKey[i].getFieldPath(false).fieldNames.slice(1).join(".");
			// append a named integer based on the sort order
			keyObj[fieldPath] = this.vAscending[i] ? 1 : -1;
		} else {
			// other expressions use a made-up field name
			keyObj[{"$computed":i}] = this.vSortKey[i].serialize(explain);
		}
	}
	return keyObj;
};

/**
 * Creates a new SortDocumentSource from Json
 *
 * @param {Object} elem
 * @param {Object} expCtx
 *
**/
klass.createFromJson = function createFromJson(elem, expCtx) {
	if (typeof elem !== "object") throw new Error("code 15973; the " + klass.sortName + " key specification must be an object");

	return klass.create(expCtx, elem);
};

/**
 * Creates a new SortDocumentSource
 *
 * @param {Object} expCtx
 * @param {object} sortorder
 * @param {int} limit
 *
**/
klass.create = function create(expCtx, sortOrder, limit) {

	var Sort = proto.getFactory(),
		nextSort = new Sort(expCtx);

	/* check for then iterate over the sort object */
	var sortKeys = 0;
	for(var keyField in sortOrder) { //jshint ignore:line
		var fieldName = keyField.fieldName;

		if ( fieldName === "$mergePresorted" ){
			Sort._mergePresorted = true;
			continue;
		}

		if ( keyField instanceof Object) {
			// this restriction is due to needing to figure out sort direction
			throw new Error("code 17312; " + klass.sortName + "the only expression supported by $sort right now is {$meta: 'textScore'}");
		}

		if (typeof sortOrder[keyField] !== "number")
			throw new Error("code 15974; " + klass.sortName + "$sort key ordering must be specified using a number or {$meta: 'text'}");

		// RedBeard0531 can the thanked.
		var sortDirection = 0;
		sortDirection = sortOrder[keyField];
		if (sortDirection !== 1 && sortDirection !== -1)
			throw new Error("code 15975; " + klass.sortName + " $sort key ordering must be 1 (for ascending) or -1 (for descending)");

		nextSort.addKey(keyField, (sortDirection > 0));
		++sortKeys;
	}

	if (sortKeys <= 0)
		throw new Error("code 15976; " + klass.sortName + " must have at least one sort key");


	if ( limit > 0) {
		var coalesced = nextSort.coalesce(LimitDocumentSource.create(expCtx, limit));
		if (!coalesced) throw new Error("Assertion failure"); // should always coalesce
		if (nextSort.getLimit() === limit) throw new Error("Assertion failure"); // should always coalesce
	}

	return nextSort;
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
	for(var i = 0; i < this.vSortKey.length; i++) {
		this.vSortKey[i].addDependencies(deps);
	}

	return DocumentSource.GetDepsReturn.SEE_NEXT;
};

/**
 * Get shard source.
 *
 * @returns {this}
 */
proto.getShardSource = function getShardSource() {
	if (this._mergePresorted) throw new Error("getShardSource", + klass.sortName + " should not be merging presorted");
	return this;
};

/**
 * Get merge source.
 *
 * @returns {SortDocumentSource}
 */
proto.getMergeSource = function getMergeSource() {
	if ( this._mergingPresorted) throw new Error("getMergeSource", + klass.sortName + " should not be merging presorted");
	var other = new SortDocumentSource();
	other.vAscending = this.vAscending;
	other.vSortKey = this.vSortKey;
	other.limitSrc = this.limitSrc;
	other._mergingPresorted = true;
	return other;
};
