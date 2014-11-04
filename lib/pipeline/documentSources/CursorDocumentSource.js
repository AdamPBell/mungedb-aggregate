"use strict";

var async = require('async'),
	Value = require('../Value'),
	Runner = require('../../Runner'),
	DocumentSource = require('./DocumentSource'),
	LimitDocumentSource = require('./LimitDocumentSource');

/**
 * Constructs and returns Documents from the BSONObj objects produced by a supplied Runner.
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
var CursorDocumentSource = module.exports = CursorDocumentSource = function CursorDocumentSource(namespace, runner, expCtx){
	base.call(this, expCtx);

	this._docsAddedToBatches = 0;
	this._ns = namespace;
	this._runner = runner;

}, klass = CursorDocumentSource, base = DocumentSource, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.MaxDocumentsToReturnToClientAtOnce = 150; //we are using documents instead of bytes

proto._currentBatch = [];

// BSONObj members must outlive _projection and cursor.
proto._query = undefined;
proto._sort = undefined;
proto._projection = undefined;
proto._dependencies = undefined;
proto._limit = undefined;
proto._docsAddedToBatches = undefined; // for _limit enforcement

proto._ns = undefined;
proto._runner = undefined; // PipelineRunner holds a weak_ptr to this.



proto.isValidInitialSource = function(){
	return true;
};

/**
 * Release the Cursor and the read lock it requires, but without changing the other data.
 * Releasing the lock is required for proper concurrency, see SERVER-6123.  This
 * functionality is also used by the explain version of pipeline execution.
 *
 * @method	dispose
 **/
proto.dispose = function dispose() {
	if (this._runner) this._runner.reset();
	this._currentBatch = [];
};

proto.getSourceName = function getSourceName() {
	return "$cursor";
};

proto.getNext = function getNext(callback) {
	if (this.expCtx && this.expCtx.checkForInterrupt && this.expCtx.checkForInterrupt()){
		return callback(new Error('Interrupted'));
	}
	
	var self = this;
	if (self._currentBatch.length === 0) {
		return self.loadBatch(function(err){
			if (err) return callback(err);
			if (self._currentBatch.length === 0)
				return callback(null, null);
			
			return callback(null, self._currentBatch.splice(0,1)[0]);
		});
	}
	return callback(null, self._currentBatch.splice(0,1)[0]);
};

proto.coalesce = function coalesce(nextSource) {
	// Note: Currently we assume the $limit is logically after any $sort or
	// $match. If we ever pull in $match or $sort using this method, we
	// will need to keep track of the order of the sub-stages.

	if (!this._limit) {
		if (nextSource instanceof LimitDocumentSource) {
			this._limit = nextSource;
			return this._limit;
		}
		return false;// false if next is not a $limit
	}
	else {
		return this._limit.coalesce(nextSource);
	}

	return false;
};


/**
 * Record the query that was specified for the cursor this wraps, if
 * any.
 * 
 * This should be captured after any optimizations are applied to
 * the pipeline so that it reflects what is really used.
 * 
 * This gets used for explain output.
 *
 * @method	setQuery
 * @param	{Object}	pBsonObj	the query to record
 **/
proto.setQuery = function setQuery(query) {
	this._query = query;
};

/**
 * Record the sort that was specified for the cursor this wraps, if
 * any.
 * 
 * This should be captured after any optimizations are applied to
 * the pipeline so that it reflects what is really used.
 * 
 * This gets used for explain output.
 *
 * @method	setSort
 * @param	{Object}	pBsonObj	the query to record
 **/
proto.setSort = function setSort(sort) {
	this._sort = sort;
};

/**
 * Informs this object of projection and dependency information.
 *
 * @method	setProjection
 * @param	{Object}	projection
 **/
proto.setProjection = function setProjection(projection, deps) {
	this._projection = projection;
	this._dependencies = deps;
};

/**
 *
 * @method setSource
 * @param source   {DocumentSource}  the underlying source to use
 * @param callback  {Function}        a `mungedb-aggregate`-specific extension to the API to half-way support reading from async sources
 **/
proto.setSource = function setSource(theSource) {
	throw new Error('this doesnt take a source');
};

proto.serialize = function serialize(explain) {

	// we never parse a documentSourceCursor, so we only serialize for explain
	if (!explain)
		return {};

	var out = {};
	out[this.getSourceName()] = {
		query: this._query,
		sort: this._sort ? this._sort : null,
		limit: this._limit ? this._limit.getLimit() : null,
		fields: this._projection ? this._projection : null,
		plan: this._runner.getInfo(explain)
	};
	return out;
};

/**
 * returns -1 for no limit
 * 
 * @method getLimit
**/
proto.getLimit = function getLimit() {
	return this._limit ? this._limit.getLimit() : -1;
};

proto.loadBatch = function loadBatch(callback) {
	if (!this._runner) {
		this.dispose();
		return callback;
	}
	
	this._runner.restoreState();

	var self = this,
		continueWhile = true;
	return async.whilst(
		function test(){
			return continueWhile === true;
		},
		function(next) {
			return self._runner.getNext(function(err, obj, state){
				if (err) return next(err);
				if (state === Runner.RunnerState.RUNNER_ADVANCED) {
					if (self._dependencies) {
						self._currentBatch.push(self._dependencies.extractFields(obj));
					} else {
						self._currentBatch.push(obj);
					}

					if (self._limit) {
						if (++self._docsAddedToBatches === self._limit.getLimit()) {
							continueWhile = false;
							return next();
						}
						//this was originally a 'verify' in the mongo code
						if (self._docsAddedToBatches > self._limit.getLimit()){
							return next(new Error('documents collected past the end of the limit'));
						}
					}

					if (self._currentBatch >= klass.MaxDocumentsToReturnToClientAtOnce) {
						// End self batch and prepare Runner for yielding.
						self._runner.saveState();
						continueWhile = false;
					}
				} else {
					continueWhile = false;
				}
				return next();
			});
		},
		function(err){
			self._runner.reset();
			callback(err);
		}
	);
};
