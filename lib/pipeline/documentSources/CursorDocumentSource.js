"use strict";

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
//proto.setQuery = function setQuery(pBsonObj) {};
//
//
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
proto.setProjection = function setProjection(projection) {

	if (this._projection){
		throw new Error("projection is already set");
	}


	//dont think we need this yet

//	this._projection = new Projection();
//	this._projection.init(projection);
//
//	this.cursor().fields = this._projection;

	this._projection = projection;  //just for testing
};

//----------------virtuals from DocumentSource--------------
/**
 * Is the source at EOF?
 * @method	eof
 **/
proto.eof = function eof() {
	if (!this.current) this.findNext(); // if we haven't gotten the first one yet, do so now
	return (this.current === null);
};

/**
 * Advance the state of the DocumentSource so that it will return the next Document.
 * The default implementation returns false, after checking for interrupts.
 * Derived classes can call the default implementation in their own implementations in order to check for interrupts.
 *
 * @method	advance
 * @returns	{Boolean}	whether there is another document to fetch, i.e., whether or not getCurrent() will succeed.  This default implementation always returns false.
 **/
proto.advance = function advance() {
	base.prototype.advance.call(this); // check for interrupts
	if (!this.current) this.findNext(); // if we haven't gotten the first one yet, do so now
	this.findNext();
	return (this.current !== null);
};

/**
 * some implementations do the equivalent of verify(!eof()) so check eof() first
 * @method	getCurrent
 * @returns	{Document}	the current Document without advancing
 **/
proto.getCurrent = function getCurrent() {
	if (!this.current) this.findNext(); // if we haven't gotten the first one yet, do so now
	return this.current;
};

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
proto.setSource = function setSource(theSource, callback) {
	if (theSource) throw new Error("CursorDocumentSource doesn't take a source"); //TODO: This needs to put back without the if once async is fully and properly supported
	if (callback) return process.nextTick(callback);
};

/**
 * Create an object that represents the document source.  The object
 * will have a single field whose name is the source's name.  This
 * will be used by the default implementation of addToBsonArray()
 * to add this object to a pipeline being represented in BSON.
 *
 * @method	sourceToJson
 * @param	{Object} pBuilder	BSONObjBuilder: a blank object builder to write to
 * @param	{Boolean}	explain	create explain output
 **/
proto.sourceToJson = function sourceToJson(pBuilder, explain) {
	/* this has no analog in the BSON world, so only allow it for explain */
	//if (explain){
	////we are not currently supporting explain in mungedb-aggregate
	//}
};

//----------------private--------------

proto.findNext = function findNext(){

	if ( !this._cursorWithContext ) {
		this.current = null;
		return;
	}

	for( ; this.cursor().ok(); this.cursor().advance() ) {

		//yieldSometimes();
//		if ( !this.cursor().ok() ) {
//			// The cursor was exhausted during the yield.
//			break;
//		}

//		if ( !this.cursor().currentMatches() || this.cursor().currentIsDup() )
//			continue;


		// grab the matching document
		var documentObj;
//		if (this.canUseCoveredIndex()) { ...  Dont need any of this, I think

		documentObj = this.cursor().current();
		this.current = documentObj;
		this.cursor().advance();
		return;
	}

	// If we got here, there aren't any more documents.
	// The CursorWithContext (and its read lock) must be released, see SERVER-6123.
	this.dispose();
	this.current = null;
};

proto.cursor = function cursor(){
	if( this._cursorWithContext && this._cursorWithContext._cursor){
		return this._cursorWithContext._cursor;
	}
	throw new Error("cursor not defined");
};

//proto.chunkMgr = function chunkMgr(){};

//proto.canUseCoveredIndex = function canUseCoveredIndex(){};

//proto.yieldSometimes = function yieldSometimes(){};
