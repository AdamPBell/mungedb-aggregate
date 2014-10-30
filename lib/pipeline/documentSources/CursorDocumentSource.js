"use strict";

var DocumentSource = require('./DocumentSource'),
	LimitDocumentSource = require('./LimitDocumentSource');

// Mimicking max memory size from mongo/db/query/new_find.cpp
// Need to actually decide some size for this?
var MAX_BATCH_DOCS = 150;

/**
 * Constructs and returns Documents from the objects produced by a supplied Cursor.
 * An object of this type may only be used by one thread, see SERVER-6123.
 *
 * This is usually put at the beginning of a chain of document sources
 * in order to fetch data from the database.
 *
 * @class CursorDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param	{CursorDocumentSource.CursorWithContext}	cursorWithContext the cursor to use to fetch data
 **/
var CursorDocumentSource = module.exports = CursorDocumentSource = function CursorDocumentSource(cursorWithContext, expCtx){
	base.call(this, expCtx);

	this.current = null;

//	this.ns = null;
//	/*
//	The bson dependencies must outlive the Cursor wrapped by this
//	source.  Therefore, bson dependencies must appear before pCursor
//	in order cause its destructor to be called *after* pCursor's.
//	*/
//	this.query = null;
//	this.sort = null;

	this._projection = null;

	this._cursorWithContext = cursorWithContext;
	this._curIdx = 0;
	this._currentBatch = [];
	this._limit = undefined;
	this._docsAddedToBatches = 0;

	if (!this._cursorWithContext || !this._cursorWithContext._cursor) throw new Error("CursorDocumentSource requires a valid cursorWithContext");

}, klass = CursorDocumentSource, base = require('./DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});


klass.CursorWithContext = (function (){
	/**
	 * Holds a Cursor and all associated state required to access the cursor.
	 * @class CursorWithContext
	 * @namespace mungedb-aggregate.pipeline.documentSources.CursorDocumentSource
	 * @module mungedb-aggregate
	 * @constructor
	 **/
	var klass = function CursorWithContext(ns){
		this._cursor = null;
	};
	return klass;
})();

/**
 * Release the Cursor and the read lock it requires, but without changing the other data.
 * Releasing the lock is required for proper concurrency, see SERVER-6123.  This
 * functionality is also used by the explain version of pipeline execution.
 *
 * @method	dispose
 **/
proto.dispose = function dispose() {
	this._cursorWithContext = null;
	this._currentBatch = [];
	this._curIdx = 0;
};

proto.getSourceName = function getSourceName() {
	return "$cursor";
};

proto.getNext = function getNext(callback) {
	if (!callback) throw new Error(this.getSourceName() + ' #getNext() requires callback');

	if (this._currentBatch.length <= this._curIdx) {
		this.loadBatch();

		if (this._currentBatch.length <= this._curIdx) {
			callback(null, DocumentSource.EOF);
			return DocumentSource.EOF;
		}
	}

	// Don't unshift. It's expensiver.
	var out = this._currentBatch[this._curIdx];
	this._curIdx++;

	callback(null, out);
	return out;
};

proto.coalesce = function coalesce(nextSource) {
	if (this._limit) {
		return this._limit.coalesce(nextSource);
	} else if (nextSource instanceof LimitDocumentSource) {
		this._limit = nextSource;
		return this._limit;
	} else {
		return false;
	}
};

///**
// * Record the namespace.  Required for explain.
// *
// * @method	setNamespace
// * @param	{String}	ns	the namespace
// **/
//proto.setNamespace = function setNamespace(ns) {}
//
///**
// * Record the query that was specified for the cursor this wraps, if any.
// * This should be captured after any optimizations are applied to
// * the pipeline so that it reflects what is really used.
// * This gets used for explain output.
// *
// * @method	setQuery
// * @param	{Object}	pBsonObj	the query to record
// **/
proto.setQuery = function setQuery(query) {
	this._query = query;
};

///**
// * Record the sort that was specified for the cursor this wraps, if any.
// * This should be captured after any optimizations are applied to
// * the pipeline so that it reflects what is really used.
// * This gets used for explain output.
// *
// * @method	setSort
// * @param	{Object}	pBsonObj	the query to record
// **/
//proto.setSort = function setSort(pBsonObj) {};

/**
 * setProjection method
 *
 * @method	setProjection
 * @param	{Object}	projection
 **/
proto.setProjection = function setProjection(projection, deps) {

	if (this._projection){
		throw new Error("projection is already set");
	}


	//dont think we need this yet

//	this._projection = new Projection();
//	this._projection.init(projection);
//
//	this.cursor().fields = this._projection;

	this._projection = projection;  //just for testing
	this._dependencies = deps;
};

//----------------virtuals from DocumentSource--------------

/**
 * Set the underlying source this source should use to get Documents
 * from.
 * It is an error to set the source more than once.  This is to
 * prevent changing sources once the original source has been started;
 * this could break the state maintained by the DocumentSource.
 * This pointer is not reference counted because that has led to
 * some circular references.  As a result, this doesn't keep
 * sources alive, and is only intended to be used temporarily for
 * the lifetime of a Pipeline::run().
 *
 * @method setSource
 * @param source   {DocumentSource}  the underlying source to use
 * @param callback  {Function}        a `mungedb-aggregate`-specific extension to the API to half-way support reading from async sources
 **/
proto.setSource = function setSource(theSource) {
	if (theSource) throw new Error("CursorDocumentSource doesn't take a source"); //TODO: This needs to put back without the if once async is fully and properly supported
};

proto.serialize = function serialize(explain) {
	if (!explain)
		return null;

	if (!this._cursorWithContext)
		throw new Error("code 17135; Cursor deleted.");

	// A stab at what mongo wants
	return {
		query: this._query,
		sort: this._sort ? this._sort : null,
		limit: this._limit ? this._limit : null,
		fields: this._projection ? this._projection : null,
		indexonly: false,
		cursorType: this._cursorWithContext ? "cursor" : null
	};
};

// LimitDocumentSource has the setLimit function which trickles down to any documentsource
proto.getLimit = function getLimit() {
	return this._limit ? this._limit.getLimit() : -1;
};

//----------------private--------------

//proto.chunkMgr = function chunkMgr(){};

//proto.canUseCoveredIndex = function canUseCoveredIndex(){};

//proto.yieldSometimes = function yieldSometimes(){};

proto.loadBatch = function loadBatch() {
	var nDocs = 0,
		cursor = this._cursorWithContext ? this._cursorWithContext._cursor : null;

	if (!cursor)
		return this.dispose();

	for(;cursor.ok(); cursor.advance()) {
		if (!cursor.ok())
			break;

		// these methods do not exist
		// if (!cursor.currentMatches() || cursor.currentIsDup())
		// continue;

		var next = cursor.current();
		this._currentBatch.push(this._projection ? base.documentFromJsonWithDeps(next, this._dependencies) : next);

		if (this._limit) {
			this._docsAddedToBatches++;
			if (this._docsAddedToBatches == this._limit.getLimit())
				break;

			if (this._docsAddedToBatches >= this._limit.getLimit()) {
				throw new Error("added documents to the batch over limit size");
			}
		}

		// Mongo uses number of bytes, but that doesn't make sense here. Yield when nDocs is over a threshold
		if (nDocs > MAX_BATCH_DOCS) {
			this._curIdx++; // advance the deque
			nDocs++;
			return;
		}
	}

	this._cursorWithContext = undefined;	//NOTE: Trying to emulate erasing the cursor; not exactly how mongo does it
};
