"use strict";

var async = require('async'),
	Value = require('../Value'),
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

proto._currentBatch = undefined;

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
}

/**
 * Release the Cursor and the read lock it requires, but without changing the other data.
 * Releasing the lock is required for proper concurrency, see SERVER-6123.  This
 * functionality is also used by the explain version of pipeline execution.
 *
 * @method	dispose
 **/
proto.dispose = function dispose() {
	this._runner.reset();
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
	if (this._currentBatch.length === 0) {
		return this.loadBatch(function(err){
			if (err) return callback(err);
			
			if (this._currentBatch.length === 0)
				return callback(null, null);
			
			return callback(null, this._currentBatch.splice(0,1)[0]);
		});
	}
	return callback(null, this._currentBatch.splice(0,1)[0]);
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
	this._sort = sort
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

//proto.extractInfo = function extractInfo(info) {
        //var out = {};

        //if (info.isClausesSet()) {
            //var clauses = [];
            //for (var i = 0; i < info.sizeClauses(); i++) {
                //clauses.push(this.extractInfo(info.getClausesAt(i)));
            //}
            //out.clauses = clauses;
        //}

        //if (info.isCursorSet())
            //out.cursor = info.getCursor();

        //if (info.isIsMultiKeySet())
            //out.isMultiKey = info.getIsMultiKey();

        //if (info.isScanAndOrderSet())
            //out.scanAndOrder = info.getScanAndOrder();
///*
//#if 0 // Disabled pending SERVER-12015 since until then no aggs will be index only.
        //if (info->isIndexOnlySet())
            //out[TypeExplain::indexOnly()] = Value(info->getIndexOnly());
//#endif
//*/
        //if (info.isIndexBoundsSet())
            //out.indexBounds = info.getIndexBounds();

        //if (info.isAllPlansSet()) {
            //var allPlans = [];
            //for (var i = 0; i < info.sizeAllPlans(); i++) {
                //allPlans.push(extractInfo(info.getAllPlansAt(i)));
            //}
            //out.allPlans = allPlans;
        //}
        //return out;
    //}

proto.serialize = function serialize(explain) {

	// we never parse a documentSourceCursor, so we only serialize for explain
	if (!explain)
		return {};

	//Status explainStatus(ErrorCodes::InternalError, "");
	//scoped_ptr<TypeExplain> plan;
	//{
		//Lock::DBRead lk(_ns);
		//Client::Context ctx(_ns, storageGlobalParams.dbpath, /*doVersion=*/false);
		//massert(17392, "No _runner. Were we disposed before explained?",
				//_runner);

		//_runner->restoreState();

		//TypeExplain* explainRaw;
		//explainStatus = _runner->getInfo(&explainRaw, NULL);
		//if (explainStatus.isOK())
			//plan.reset(explainRaw);

		//_runner->saveState();
	//}

	//MutableDocument out;
	//out["query"] = Value(_query);

	//if (!_sort.isEmpty())
		//out["sort"] = Value(_sort);

	//if (_limit)
		//out["limit"] = Value(_limit->getLimit());

	//if (!_projection.isEmpty())
		//out["fields"] = Value(_projection);

	//if (explainStatus.isOK()) {
		//out["plan"] = Value(extractInfo(plan));
	//} else {
		//out["planError"] = Value(explainStatus.toString());
	//}

	//return Value(DOC(getSourceName() << out.freezeToValue()));
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
		state = true;
	return async.whilst(
		function() test{
			return state === true;
		},
		function(next) {
			return self._runner.getNext(function(err, obj){
				if (err) return next(err);
				
				if (self._dependencies) {
					self._currentBatch.push(self._dependencies.extractFields(obj));
				} else {
					self._currentBatch.push(obj);
				}

				if (self._limit) {
					if (++self._docsAddedToBatches === self._limit.getLimit()) {
						state = false;
					}
					
					//self was originally a 'verify' in the mongo code
					if (!(self._docsAddedToBatches < self._limit.getLimit())){
						return next(new Error('self should not happen'));
					};
				}

				if (self._currentBatch >= klass.MaxDocumentsToReturnToClientAtOnce) {
					// End self batch and prepare Runner for yielding.
					self._runner.saveState();
					state = false;
				}
				return next();
			});
		},
		callback
	);
};
