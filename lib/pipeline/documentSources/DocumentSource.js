"use strict";

/**
 * A base class for all document sources
 * @class DocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param expCtx  {ExpressionContext}
 **/
var DocumentSource = module.exports = function DocumentSource(expCtx){
	if(arguments.length !== 1) throw new Error("one arg expected");

	/*
	* Most DocumentSources have an underlying source they get their data
	* from.  This is a convenience for them.
	* The default implementation of setSource() sets this; if you don't
	* need a source, override that to verify().  The default is to
	* verify() if this has already been set.
	*/
	this.source = null;

	/*
	* The zero-based user-specified pipeline step.  Used for diagnostics.
	* Will be set to -1 for artificial pipeline steps that were not part
	* of the original user specification.
	*/
	this.step = -1;

	this.expCtx = expCtx || {};

	/*
	*  for explain: # of rows returned by this source
	*  This is *not* unsigned so it can be passed to JSONObjBuilder.append().
	*/
	this.nRowsOut = 0;

}, klass = DocumentSource, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

/*
class DocumentSource :
public IntrusiveCounterUnsigned,
public StringWriter {
public:
virtual ~DocumentSource();

// virtuals from StringWriter
virtual void writeString(stringstream &ss) const;
*/

/**
 * Set the step for a user-specified pipeline step.
 * @method	setPipelineStep
 * @param	{Number}	step	number 0 to n.
 **/
proto.setPipelineStep = function setPipelineStep(step) {
	this.step = step;
};

/**
 * Get the user-specified pipeline step.
 * @method	getPipelineStep
 * @returns	{Number}	step
 **/
proto.getPipelineStep = function getPipelineStep() {
	return this.step;
};

/**
 * some implementations do the equivalent of verify(!eof()) so check eof() first
 * @method	getNExt
 * @returns	{Document}	the current Document without advancing
 **/
proto.getNext = function getNext(callback) {
	throw new Error("not implemented");
};

/**
 * Inform the source that it is no longer needed and may release its resources.  After
 * dispose() is called the source must still be able to handle iteration requests, but may
 * become eof().
 * NOTE: For proper mutex yielding, dispose() must be called on any DocumentSource that will
 * not be advanced until eof(), see SERVER-6123.
 *
 * @method	dispose
 **/
proto.dispose = function dispose() {
	if ( this.source ) {
		// This is required for the DocumentSourceCursor to release its read lock, see
		// SERVER-6123.
		this.source.dispose();
	}
};

/**
 * Get the source's name.
 * @method	getSourceName
 * @returns	{String}	the string name of the source as a constant string; this is static, and there's no need to worry about adopting it
 **/
proto.getSourceName = function getSourceName() {
	return "[UNKNOWN]";
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
 * @method	setSource
 * @param	{DocumentSource}	source	the underlying source to use
 **/
proto.setSource = function setSource(theSource) {
	if (this.source) throw new Error("It is an error to set the source more than once");
	this.source = theSource;
};

/**
 * Attempt to coalesce this DocumentSource with its successor in the
 * document processing pipeline.  If successful, the successor
 * DocumentSource should be removed from the pipeline and discarded.
 * If successful, this operation can be applied repeatedly, in an
 * attempt to coalesce several sources together.
 * The default implementation is to do nothing, and return false.
 *
 * @method	coalesce
 * @param	{DocumentSource}	nextSource	the next source in the document processing chain.
 * @returns	{Boolean}	whether or not the attempt to coalesce was successful or not; if the attempt was not successful, nothing has been changed
 **/
proto.coalesce = function coalesce(nextSource) {
	return false;
};

/**
 * Optimize the pipeline operation, if possible.  This is a local
 * optimization that only looks within this DocumentSource.  For best
 * results, first coalesce compatible sources using coalesce().
 * This is intended for any operations that include expressions, and
 * provides a hook for those to optimize those operations.
 * The default implementation is to do nothing.
 *
 * @method	optimize
 **/
proto.optimize = function optimize() {
};

klass.GetDepsReturn = {
	NOT_SUPPORTED: "NOT_SUPPORTED", // This means the set should be ignored
	EXHAUSTIVE: "EXHAUSTIVE", // This means that everything needed should be in the set
	SEE_NEXT: "SEE_NEXT" // Add the next Source's deps to the set
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
	return klass.GetDepsReturn.NOT_SUPPORTED;
};

/**
 * This takes dependencies from getDependencies and
 * returns a projection that includes all of them
 *
 * @method	depsToProjection
 * @param	{Object} deps	set (unique array) of strings
 * @returns	{Object}	JSONObj
 **/
klass.depsToProjection = function depsToProjection(deps) {
	var needId = false,
		bb = {};
	if (deps._id === undefined)
		bb._id = 0;

	var last = "";
	Object.keys(deps).sort().forEach(function(it){
		if (it.indexOf('_id') === 0 && (it.length === 3 || it[3] === '.')) {
			needId = true;
			return;
		} else {
			if (last !== "" && it.slice(0, last.length) === last){
				// we are including a parent of *it so we don't need to
				// include this field explicitly. In fact, due to
				// SERVER-6527 if we included this field, the parent
				// wouldn't be fully included.
				return;
			}
		}
		last = it + ".";
		bb[it] = 1;
	});

	if (needId) // we are explicit either way
		bb._id = 1;
	else
		bb._id = 0;


	return bb;
};

proto._serialize = function _serialize(explain) {
	throw new Error("not implemented");
};

proto.serializeToArray = function serializeToArray(array, explain) {
	var entry = this.serialize(explain);
	if (!entry) {
		array.push(entry);
	}
};
