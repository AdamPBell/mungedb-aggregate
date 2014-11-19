"use strict";

var async = require("async"),
	Runner = require("../../query/Runner"),
	DocumentSource = require("./DocumentSource"),
	LimitDocumentSource = require("./LimitDocumentSource");

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
 * @param ns {String}
 * @param runner {Runner}
 * @param expCtx {Object}
 */
var CursorDocumentSource = module.exports = CursorDocumentSource = function CursorDocumentSource(ns, runner, expCtx){
	base.call(this, expCtx);

	this._docsAddedToBatches = 0; // for _limit enforcement
	this._ns = ns;
	this._runner = runner;

	this._currentBatch = [];
	this._currentBatchIndex = 0; //NOTE: DEVIATION FROM MONGO: they do not track index

	// BSONObj members must outlive _projection and cursor.
	this._query = undefined;
	this._sort = undefined;
	this._projection = undefined;
	this._dependencies = undefined;
	this._limit = undefined;

	this._firstRun = true; //NOTE: DEVIATION FROM MONGO: to ensure that the callstack does not get too large doing things syncronously
}, klass = CursorDocumentSource, base = DocumentSource, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

proto.getSourceName = function getSourceName() {
	return "$cursor";
};

proto.getNext = function getNext(callback) {
	if (this.expCtx && this.expCtx.checkForInterrupt && this.expCtx.checkForInterrupt()) {
		return callback(new Error("Interrupted"));
	}

	var self = this;
	if (self._currentBatchIndex >= self._currentBatch.length) {
		self._currentBatchIndex = 0;
		self._currentBatch = [];
		return self._loadBatch(function(err){
			if (err) return callback(err);

			if (self._currentBatch.length === 0) // exhausted the cursor
				return callback(null, null);

			var out = self._currentBatch[self._currentBatchIndex];
			self._currentBatchIndex++;
			return callback(null, out);
		});
	}
	return callback(null, self._currentBatch[self._currentBatchIndex++]);
};

proto.dispose = function dispose() {
	// Can't call in to Runner or ClientCursor registries from this function since it will be
	// called when an agg cursor is killed which would cause a deadlock.
	this._runner = undefined;
	this._currentBatch = [];
};

proto._loadBatch = function _loadBatch(callback) {
	if (!this._runner) {
		this.dispose();
		return callback();
	}

	this._runner.restoreState();

	var self = this,
		whileShouldBreak = false, // mimic while loop break in async land
		whileShouldReturn = false; // mimic while loop return in async land
	return async.whilst(
		function test(){
			return !whileShouldBreak && !whileShouldReturn;
		},
		function(next) {
			return self._runner.getNext(function(err, obj, state){
				if (err) return next(err);

				//NOTE: DEVIATION FROM MONGO: they check state in the loop condition we check it inside (due to async stuff)
				if (state !== Runner.RunnerState.RUNNER_ADVANCED) return whileShouldBreak = true, next();

				if (self._dependencies) {
					self._currentBatch.push(self._dependencies.extractFields(obj));
				} else {
					self._currentBatch.push(obj);
				}

				if (self._limit) {
					if (++self._docsAddedToBatches === self._limit.getLimit()) {
						return whileShouldBreak = true, next();
					}
					if (self._docsAddedToBatches > self._limit.getLimit()) return next(new Error("Assertion failure: end of limit"));
				}

				var memUsageDocs = self._currentBatch.length;
				if (memUsageDocs >= klass.MaxDocumentsToReturnToClientAtOnce) {
					// End self batch and prepare Runner for yielding.
					self._runner.saveState();
					return whileShouldReturn = true, next();
				}

				return next();
			});
		},
		function(err){
			if (whileShouldReturn){
				return setImmediate(function() {
					callback(err);
				});
			}

			// If we got here, there won't be any more documents, so destroy the runner. Can't use
			// dispose since we want to keep the _currentBatch.
			self._runner = undefined;

			//NOTE: DEVIATION FROM MONGO: to ensure that the callstack does not get too large if the Runner does things syncronously
			if (self._firstRun || !self._currentBatch.length){
				self._firstRun = false;
				callback(err);
			} else {
				return setImmediate(function(){
					callback(err);
				});
			}
		}
	);
};

proto.setSource = function setSource(theSource) {
	// this doesn't take a source
	throw new Error("Assertion error: this doesnt take a source");
};

/**
 * returns -1 for no limit
 * @method getLimit
 */
proto.getLimit = function getLimit() {
	return this._limit ? this._limit.getLimit() : -1;
};

proto.coalesce = function coalesce(nextSource) {
	// Note: Currently we assume the $limit is logically after any $sort or
	// $match. If we ever pull in $match or $sort using this method, we
	// will need to keep track of the order of the sub-stages.

	if (!this._limit) {
		this._limit = nextSource instanceof LimitDocumentSource ? nextSource : undefined;
		return Boolean(this._limit); // false if next is not a $limit
	} else {
		return this._limit.coalesce(nextSource);
	}

	return false;
};

function extractInfo(o) { //NOTE: DEVIATION FROM MONGO: skipping a lot of explain for now
	return o;
}

proto.serialize = function serialize(explain) { //NOTE: DEVIATION FROM MONGO: parts of this not implemented, may want later
	// we never parse a documentSourceCursor, so we only serialize for explain
	if (!explain)
		return null;

	var plan;
	//	explainStatus = {code:ErrorCodes.INTERNAL_ERROR, description:""};
	//NOTE: DEVIATION FROM MONGO: our `Runner#getInfo()` API is a little broken
	//TODO: fix our `Runner#getInfo()` API to match their API
	{
		if (!this._runner)
			throw new Error("No _runner. Were we disposed before explained?; massert code 17392");

		this._runner.restoreState();

		var explainRaw = {};
		explainRaw = this._runner.getInfo(explain, null);
		if (explainRaw) //TODO: use this instead:  if (explainStatus.code === ErrorCodes.OK)
			plan = explainRaw;

		this._runner.saveState();
	}

	var out = {};
	out.query = this._query;

	if (this._sort && Object.keys(this._sort).length > 0)
		out.sort = this._sort;

	if (this._limit)
		out.limit = this._limit.getLimit();

	if (this._projection && Object.keys(this._projection).length > 0)
		out.fields = this._projection;

	if (true) { //TODO: use this instead:  if (explainStatus.code === ErrorCodes.OK) {
		out.plan = extractInfo(plan);
	} else {
		out.planError = "ERROR EXPLAINING PLAN"; //TODO: use this instead:  explainStatus
	}

	var doc = {};
	doc[this.getSourceName()] = out;
	return doc;
};

/**
 * Create a document source based on a passed-in Runner.
 *
 * This is usually put at the beginning of a chain of document sources
 * in order to fetch data from the database.
 *
 * @method create
 * @static
 * @param ns {String}
 * @param runner {Runner}
 * @param expCtx {Object}
 */
klass.create = function create(ns, runner, expCtx) {
	return new CursorDocumentSource(ns, runner, expCtx);
};

/**
 * Informs this object of projection and dependency information.
 *
 * @method setProjection
 * @param projection A projection specification describing the fields needed by the rest of
 *                   the pipeline.
 * @param deps The output of DepsTracker::toParsedDeps
 */
proto.setProjection = function setProjection(projection, deps) {
	this._projection = projection;
	this._dependencies = deps;
};

proto.isValidInitialSource = function(){
	return true;
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
 */
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
 * @param	{Object}	pBsonObj	the sort to record
 */
proto.setSort = function setSort(sort) {
	this._sort = sort;
};

klass.MaxDocumentsToReturnToClientAtOnce = 150; //NOTE: DEVIATION FROM MONGO: put this here and using MaxDocuments instead of MaxBytes
