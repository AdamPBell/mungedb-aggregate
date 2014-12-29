!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.aggregate=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/**
 * This class is a simplified implementation of the cursors used in MongoDB for reading from an Array of documents.
 * @param	{Array}	items	The array source of the data
 **/
var klass = module.exports = function Cursor(items){
	if (!(items instanceof Array)) throw new Error("arg `items` must be an Array");
	this.cachedData = items.slice(0);	// keep a copy so array changes when using async doc srcs do not cause side effects
	this.length = items.length;
	this.offset = 0;
}, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

proto.ok = function ok(){
	return (this.offset < this.length) || this.hasOwnProperty("curr");
};

proto.advance = function advance(){
	if (this.offset >= this.length){
		delete this.curr;
		return false;
	}
	this.curr = this.cachedData[this.offset++];
	return this.curr;
};

proto.current = function current(){
	if (!this.hasOwnProperty("curr")) this.advance();
	return this.curr;
};

},{}],2:[function(require,module,exports){
"use strict";

/**
 * Used to aggregate `inputs` using a MongoDB-style `pipeline`
 *
 * If `inputs` is given, it will run the `inputs` through the `pipeline` and call the `callback` with the results.
 * If `inputs` is omitted, it will return an "aggregator" function so you can reuse the given `pipeline` against various `inputs`.
 *
 * NOTE: you should be mindful about reusing the same `pipeline` against disparate `inputs` because document coming in can alter the state of it's `DocumentSource`s
 *
 * @method aggregate
 * @namespace mungedb
 * @module mungedb-aggregate
 * @param pipeline  {Array}   The list of pipeline document sources in JSON format
 * @param [ctx]     {Object}  Optional context object to pass through to pipeline
 * @param [inputs]  {Array}   Optional inputs to pass through the `docSrcs` pipeline
 * @param [callback]             {Function}                                 Optional callback if using async extensions, called when done
 * @param   callback.err           {Error}                                    The Error if one occurred
 * @param   callback.docs          {Array}                                    The resulting documents
 **/
exports = module.exports = function aggregate(pipeline, ctx, inputs, callback) {	// function-style interface; i.e., return the utility function directly as the require
	var DocumentSource = exports.pipeline.documentSources.DocumentSource;
	if (ctx instanceof Array || ctx instanceof DocumentSource) callback = inputs, inputs = ctx, ctx = {};
	var pipelineInst = exports.pipeline.Pipeline.parseCommand({
			pipeline: pipeline
		}, ctx),
		aggregator = function aggregator(ctx, inputs, callback) {
			if (ctx instanceof Array || ctx instanceof DocumentSource) callback = inputs, inputs = ctx, ctx = {};
			if (!callback) callback = exports.SYNC_CALLBACK;
			if (!inputs) return callback("arg `inputs` is required");

			// rebuild the pipeline on subsequent calls
			if (!pipelineInst) {
				pipelineInst = exports.pipeline.Pipeline.parseCommand({
					pipeline: pipeline
				}, ctx);
			}

			// use or build input src
			var src;
			if(inputs instanceof DocumentSource){
				src = inputs;
			}else{
				try{
					pipelineInst.collectionName = inputs;	//NOTE: use the given `inputs` directly; not really a "name" but we don't really have collection names in mungedb-aggregate
					src = exports.pipeline.PipelineD.prepareCursorSource(pipelineInst, pipelineInst.ctx);
				}catch(err){
					return callback(err);
				}
			}

			// run the pipeline against the input src
			var results = pipelineInst.run(src, callback === exports.SYNC_CALLBACK ? undefined : function aggregated(err, results){
				if(err) return callback(err);
				return callback(null, results.result);
			});
			pipelineInst = null; // unset so that subsequent calls can rebuild the pipeline
			return results;
		};
	if(inputs) return aggregator(ctx, inputs, callback);
	return aggregator;
};

// sync callback for aggregate if none was provided
exports.SYNC_CALLBACK = function(err, docs){
	if (err) throw err;
	return docs;
};

// package-style interface; i.e., return a function underneath of the require
exports.aggregate = exports;

//Expose these so that mungedb-aggregate can be extended.
exports.Cursor = require("./Cursor");
exports.pipeline = require("./pipeline/");

// version info
exports.version = "r2.4.0-rc0";
exports.gitVersion = "cb8efcd6a2f05d35655ed9f9b947cc4a99ade8db";

},{"./Cursor":1,"./pipeline/":62}],3:[function(require,module,exports){
"use strict";

/**
 * Represents a `Document` (i.e., an `Object`) in `mongo` but in `munge` this is only a set of static helpers since we treat all `Object`s like `Document`s.
 * @class Document
 * @namespace mungedb-aggregate.pipeline
 * @module mungedb-aggregate
 * @constructor
 **/
var Document = module.exports = function Document(){
	if(this.constructor == Document) throw new Error("Never create instances! Use static helpers only.");
}, klass = Document, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("./Value");

// STATIC MEMBERS
/**
 * Shared "_id"
 * @static
 * @property ID_PROPERTY_NAME
 **/
klass.ID_PROPERTY_NAME = "_id";

/**
 * Compare two documents.
 *
 * BSON document field order is significant, so this just goes through the fields in order.
 * The comparison is done in roughly the same way as strings are compared, but comparing one field at a time instead of one character at a time.
 *
 * @static
 * @method compare
 * @param rL left document
 * @param rR right document
 * @returns an integer less than zero, zero, or an integer greater than zero, depending on whether rL < rR, rL == rR, or rL > rR
 **/
klass.compare = function compare(l, r){	//TODO: might be able to replace this with a straight compare of docs using JSON.stringify()
	var lPropNames = Object.getOwnPropertyNames(l),
		lPropNamesLength = lPropNames.length,
		rPropNames = Object.getOwnPropertyNames(r),
		rPropNamesLength = rPropNames.length;

	for(var i = 0; true; ++i) {
		if (i >= lPropNamesLength) {
			if (i >= rPropNamesLength) return 0; // documents are the same length
			return -1; // left document is shorter
		}

		if (i >= rPropNamesLength) return 1; // right document is shorter

		var nameCmp = Value.compare(lPropNames[i], rPropNames[i]);
		if (nameCmp !== 0) return nameCmp; // field names are unequal

		var valueCmp = Value.compare(l[lPropNames[i]], r[rPropNames[i]]);
		if (valueCmp) return valueCmp; // fields are unequal
	}

	/* NOTREACHED */
	throw new Error("This should never happen");	//verify(false)
//		return 0;
};

/**
 * Clone a document
 * @static
 * @method clone
 * @param document
 **/
klass.clone = function(document){
	var obj = {};
	for(var key in document){
		if(document.hasOwnProperty(key)){
			var withObjVal = document[key];
			if(withObjVal === null) { // necessary to handle null values without failing
				obj[key] = withObjVal;
			}
			else if(withObjVal.constructor === Object){
				obj[key] = Document.clone(withObjVal);
			}else{
				obj[key] = withObjVal;
			}
		}
	}
	return obj;
};

//	proto.addField = function addField(){ throw new Error("Instead of `Document#addField(key,val)` you should just use `obj[key] = val`"); }
//	proto.setField = function addField(){ throw new Error("Instead of `Document#setField(key,val)` you should just use `obj[key] = val`"); }
//  proto.getField = function getField(){ throw new Error("Instead of `Document#getField(key)` you should just use `var val = obj[key];`"); }

},{"./Value":7}],4:[function(require,module,exports){
"use strict";

/**
 * Constructor for field paths.
 *
 * The constructed object will have getPathLength() > 0.
 * Uassert if any component field names do not pass validation.
 *
 * @class FieldPath
 * @namespace mungedb-aggregate.pipeline
 * @module mungedb-aggregate
 * @constructor
 * @param fieldPath the dotted field path string or non empty pre-split vector.
 **/
var FieldPath = module.exports = function FieldPath(path) {
	var fields = typeof path === "object" && typeof path.length === "number" ? path : path.split(".");
	if(fields.length === 0) throw new Error("FieldPath cannot be constructed from an empty vector (String or Array).; code 16409");
	for(var i = 0, n = fields.length; i < n; ++i){
		var field = fields[i];
		if(field.length === 0) throw new Error("FieldPath field names may not be empty strings; code 15998");
		if(field[0] == "$") throw new Error("FieldPath field names may not start with '$'; code 16410");
		if(field.indexOf("\0") != -1) throw new Error("FieldPath field names may not contain '\\0'; code 16411");
		if(field.indexOf(".") != -1) throw new Error("FieldPath field names may not contain '.'; code 16412");
	}
	this.path = path;
	this.fields = fields;
}, klass = FieldPath, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// STATIC MEMBERS
klass.PREFIX = "$";

// PROTOTYPE MEMBERS
/**
 * Get the full path.
 *
 * @method getPath
 * @param fieldPrefix whether or not to include the field prefix
 * @returns the complete field path
 **/
proto.getPath = function getPath(withPrefix) {
	return ( !! withPrefix ? FieldPath.PREFIX : "") + this.fields.join(".");
};

/**
 * A FieldPath like this but missing the first element (useful for recursion). Precondition getPathLength() > 1.
 *
 * @method tail
 **/
proto.tail = function tail() {
	return new FieldPath(this.fields.slice(1));
};

/**
 * Get a particular path element from the path.
 *
 * @method getFieldName
 * @param i the zero based index of the path element.
 * @returns the path element
 **/
proto.getFieldName = function getFieldName(i){	//TODO: eventually replace this with just using .fields[i] directly
	return this.fields[i];
};

/**
 * Get the number of path elements in the field path.
 *
 * @method getPathLength
 * @returns the number of path elements
 **/
proto.getPathLength = function getPathLength() {
	return this.fields.length;
};

},{}],5:[function(require,module,exports){
"use strict";
var async = require("async");

/**
 * mongodb "commands" (sent via db.$cmd.findOne(...)) subclass to make a command.  define a singleton object for it.
 * @class Pipeline
 * @namespace mungedb-aggregate.pipeline
 * @module mungedb-aggregate
 * @constructor
 **/
// CONSTRUCTOR
var Pipeline = module.exports = function Pipeline(theCtx){
	this.collectionName = null;
	this.sourceVector = null;
	this.explain = false;
	this.splitMongodPipeline = false;
	this.ctx = theCtx;
}, klass = Pipeline, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var DocumentSource = require("./documentSources/DocumentSource"),
	LimitDocumentSource = require('./documentSources/LimitDocumentSource'),
	MatchDocumentSource = require('./documentSources/MatchDocumentSource'),
	ProjectDocumentSource = require('./documentSources/ProjectDocumentSource'),
	SkipDocumentSource = require('./documentSources/SkipDocumentSource'),
	UnwindDocumentSource = require('./documentSources/UnwindDocumentSource'),
	GroupDocumentSource = require('./documentSources/GroupDocumentSource'),
	SortDocumentSource = require('./documentSources/SortDocumentSource');

klass.COMMAND_NAME = "aggregate";
klass.PIPELINE_NAME = "pipeline";
klass.EXPLAIN_NAME = "explain";
klass.FROM_ROUTER_NAME = "fromRouter";
klass.SPLIT_MONGOD_PIPELINE_NAME = "splitMongodPipeline";
klass.SERVER_PIPELINE_NAME = "serverPipeline";
klass.MONGOS_PIPELINE_NAME = "mongosPipeline";

klass.stageDesc = {};//attaching this to the class for test cases
klass.stageDesc[LimitDocumentSource.limitName] = LimitDocumentSource.createFromJson;
klass.stageDesc[MatchDocumentSource.matchName] = MatchDocumentSource.createFromJson;
klass.stageDesc[ProjectDocumentSource.projectName] = ProjectDocumentSource.createFromJson;
klass.stageDesc[SkipDocumentSource.skipName] = SkipDocumentSource.createFromJson;
klass.stageDesc[UnwindDocumentSource.unwindName] = UnwindDocumentSource.createFromJson;
klass.stageDesc[GroupDocumentSource.groupName] = GroupDocumentSource.createFromJson;
klass.stageDesc[SortDocumentSource.sortName] = SortDocumentSource.createFromJson;

/**
 * Create an `Array` of `DocumentSource`s from the given JSON pipeline
 * // NOTE: DEVIATION FROM MONGO: split out into a separate function to better allow extensions (was in parseCommand)
 * @static
 * @method parseDocumentSources
 * @param pipeline  {Array}  The JSON pipeline
 * @returns {Array}  The parsed `DocumentSource`s
 **/
klass.parseDocumentSources = function parseDocumentSources(pipeline, ctx){
	var sourceVector = [];
	for (var nSteps = pipeline.length, iStep = 0; iStep < nSteps; ++iStep) {
		// pull out the pipeline element as an object
		var pipeElement = pipeline[iStep];
		if (!(pipeElement instanceof Object)) throw new Error("pipeline element " + iStep + " is not an object; code 15942");
		var obj = pipeElement;

		// Parse a pipeline stage from 'obj'.
		if (Object.keys(obj).length !== 1) throw new Error("A pipeline stage specification object must contain exactly one field; code 16435");
		var stageName = Object.keys(obj)[0],
			stageSpec = obj[stageName];

		// Create a DocumentSource pipeline stage from 'stageSpec'.
		var desc = klass.stageDesc[stageName];
		if (!desc) throw new Error("Unrecognized pipeline stage name: '" + stageName + "'; code 16435");

		// Parse the stage
		var stage = desc(stageSpec, ctx);
		if (!stage) throw new Error("Stage must not be undefined!");
		stage.setPipelineStep(iStep);
		sourceVector.push(stage);
	}
	return sourceVector;
};

/**
 * Create a pipeline from the command.
 * @static
 * @method parseCommand
 * @param cmdObj  {Object}  The command object sent from the client
 * @param   cmdObj.aggregate            {Array}    the thing to aggregate against;	// NOTE: DEVIATION FROM MONGO: expects an Array of inputs rather than a collection name
 * @param   cmdObj.pipeline             {Object}   the JSON pipeline of `DocumentSource` specs
 * @param   cmdObj.explain              {Boolean}  should explain?
 * @param   cmdObj.fromRouter           {Boolean}  is from router?
 * @param   cmdObj.splitMongodPipeline	{Boolean}  should split?
 * @param ctx     {Object}  Not used yet in mungedb-aggregate
 * @returns	{Array}	the pipeline, if created, otherwise a NULL reference
 **/
klass.parseCommand = function parseCommand(cmdObj, ctx){
	var pipelineNamespace = require("./"),
		Pipeline = pipelineNamespace.Pipeline,	// using require in case Pipeline gets replaced with an extension
		pipelineInst = new Pipeline(ctx);

	//gather the specification for the aggregation
	var pipeline;
	for(var fieldName in cmdObj){
		var cmdElement = cmdObj[fieldName];
		if(fieldName == klass.COMMAND_NAME)						pipelineInst.collectionName = cmdElement;		//look for the aggregation command
		else if(fieldName == klass.PIPELINE_NAME)				pipeline = cmdElement;							//check for the pipeline of JSON doc srcs
		else if(fieldName == klass.EXPLAIN_NAME)				pipelineInst.explain = cmdElement;				//check for explain option
		else if(fieldName == klass.FROM_ROUTER_NAME)			pipelineInst.fromRouter = cmdElement;			//if the request came from the router, we're in a shard
		else if(fieldName == klass.SPLIT_MONGOD_PIPELINE_NAME)	pipelineInst.splitMongodPipeline = cmdElement;	//check for debug options
		// NOTE: DEVIATION FROM MONGO: Not implementing: "Ignore $auth information sent along with the command. The authentication system will use it, it's not a part of the pipeline."
		else throw new Error("unrecognized field " + JSON.stringify(fieldName));
	}

	/**
	 * If we get here, we've harvested the fields we expect for a pipeline
	 * Set up the specified document source pipeline.
	 **/
	// NOTE: DEVIATION FROM MONGO: split this into a separate function to simplify and better allow for extensions (now in parseDocumentSources)
	var sourceVector = pipelineInst.sourceVector = Pipeline.parseDocumentSources(pipeline, ctx);

	/* if there aren't any pipeline stages, there's nothing more to do */
	if (!sourceVector.length) return pipelineInst;

	/* Move filters up where possible.
	CW TODO -- move filter past projections where possible, and noting corresponding field renaming.
	*/

	/*
	Wherever there is a match immediately following a sort, swap them.
	This means we sort fewer items.  Neither changes the documents in the stream, so this transformation shouldn't affect the result.
	We do this first, because then when we coalesce operators below, any adjacent matches will be combined.
	*/
	for(var srcn = sourceVector.length, srci = 1; srci < srcn; ++srci) {
		var source = sourceVector[srci];
		if (source instanceof MatchDocumentSource) {
			var previous = sourceVector[srci - 1];
			if (previous instanceof SortDocumentSource) {
				/* swap this item with the previous */
				sourceVector[srci - 1] = source;
				sourceVector[srci] = previous;
			}
		}
	}

	/*
	Coalesce adjacent filters where possible.  Two adjacent filters are equivalent to one filter whose predicate is the conjunction of the two original filters' predicates.
	For now, capture this by giving any DocumentSource the option to absorb it's successor; this will also allow adjacent projections to coalesce when possible.
	Run through the DocumentSources, and give each one the opportunity to coalesce with its successor.  If successful, remove the successor.
	Move all document sources to a temporary list.
	*/
	var tempVector = sourceVector.slice(0);
	sourceVector.length = 0;

	// move the first one to the final list
	sourceVector.push(tempVector[0]);

	// run through the sources, coalescing them or keeping them
	for(var tempn = tempVector.length, tempi = 1; tempi < tempn; ++tempi) {
		/*
		If we can't coalesce the source with the last, then move it to the final list, and make it the new last.
		(If we succeeded, then we're still on the same last, and there's no need to move or do anything with the source -- the destruction of tempVector will take care of the rest.)
		*/
		var lastSource = sourceVector[sourceVector.length - 1],
			temp = tempVector[tempi];
		if (!temp || !lastSource) throw new Error("null document sources found");
		if (!lastSource.coalesce(temp)){
			sourceVector.push(temp);
		}
	}

	// optimize the elements in the pipeline
	for(var i = 0, l = sourceVector.length; i<l; i++) {
		var iter = sourceVector[i];
		if (!iter) throw new Error("Pipeline received empty document as argument");
		iter.optimize();
	}

	return pipelineInst;
};

// sync callback for Pipeline#run if omitted
klass.SYNC_CALLBACK = function(err, results){
	if (err) throw err;
	return results.result;
};

function ifError(err) {
	if (err) throw err;
}

/**
 * Run the pipeline
 * @method run
 * @param	inputSource		{DocumentSource}	The input document source for the pipeline
 * @param	[callback]		{Function}			Optional callback function if using async extensions
**/
proto.run = function run(inputSource, callback){
	if (inputSource && !(inputSource instanceof DocumentSource)) throw new Error("arg `inputSource` must be an instance of DocumentSource");
	if (!callback) callback = klass.SYNC_CALLBACK;
	var self = this;
	if (callback === klass.SYNC_CALLBACK) { // SYNCHRONOUS MODE
		inputSource.setSource(undefined, ifError);	//TODO: HACK: temp solution to the fact that we need to initialize our source since we're using setSource as a workaround for the lack of real async cursors
		var source = inputSource;
		for(var i = 0, l = self.sourceVector.length; i < l; i++){
			var temp = self.sourceVector[i];
			temp.setSource(source, ifError);
			source = temp;
		}
		/*
		Iterate through the resulting documents, and add them to the result.
		We do this even if we're doing an explain, in order to capture the document counts and other stats.
		However, we don't capture the result documents for explain.
		*/
		var resultArray = [];
		try{
			for(var hasDoc = !source.eof(); hasDoc; hasDoc = source.advance()) {
				var document = source.getCurrent();
				resultArray.push(document);	// add the document to the result set
				//Commenting out this assertion for munge.  MUHAHAHA!!!
				// object will be too large, assert. the extra 1KB is for headers
				//if(resultArray.len() < BSONObjMaxUserSize - 1024) throw new Error("aggregation result exceeds maximum document size (" + BSONObjMaxUserSize / (1024 * 1024) + "MB); code 16389");
			}
		} catch (err) {
			return callback(err);
		}
		var result = {
			result: resultArray
//			,ok: true;	//not actually in here... where does this come from?
		};
		return callback(null, result);
	} else {	// ASYNCHRONOUS MODE	//TODO: move this up to a higher level package?
		return inputSource.setSource(undefined, function(err){	//TODO: HACK: temp solution to the fact that we need to initialize our source since we're using setSource as a workaround for the lack of real async cursors
			if (err) return callback(err);
			// chain together the sources we found
			var source = inputSource;
			async.eachSeries(
				self.sourceVector,
				function eachSrc(temp, next){
					temp.setSource(source, function(err){
						if (err) return next(err);
						source = temp;
						return next();
					});
				},
				function doneSrcs(err){ //source is left pointing at the last source in the chain
					if (err) return callback(err);
					/*
					Iterate through the resulting documents, and add them to the result.
					We do this even if we're doing an explain, in order to capture the document counts and other stats.
					However, we don't capture the result documents for explain.
					*/
					// the array in which the aggregation results reside
					var resultArray = [];
					try{
						for(var hasDoc = !source.eof(); hasDoc; hasDoc = source.advance()) {
							var document = source.getCurrent();
							resultArray.push(document);	// add the document to the result set
							//Commenting out this assertion for munge.  MUHAHAHA!!!
							// object will be too large, assert. the extra 1KB is for headers
							//if(resultArray.len() < BSONObjMaxUserSize - 1024) throw new Error("aggregation result exceeds maximum document size (" + BSONObjMaxUserSize / (1024 * 1024) + "MB); code 16389");
						}
					} catch (err) {
						return callback(err);
					}
					var result = {
						result: resultArray
	//					,ok: true;	//not actually in here... where does this come from?
					};
					return callback(null, result);
				}
			);
		});
	}
};

},{"./":62,"./documentSources/DocumentSource":19,"./documentSources/GroupDocumentSource":21,"./documentSources/LimitDocumentSource":22,"./documentSources/MatchDocumentSource":23,"./documentSources/ProjectDocumentSource":24,"./documentSources/SkipDocumentSource":25,"./documentSources/SortDocumentSource":26,"./documentSources/UnwindDocumentSource":27,"async":63}],6:[function(require,module,exports){
"use strict";

/**
 * Pipeline helper for reading data
 * @class PipelineD
 * @namespace mungedb-aggregate.pipeline
 * @module mungedb-aggregate
 * @constructor
 **/
var PipelineD = module.exports = function PipelineD(){
	if(this.constructor == PipelineD) throw new Error("Never create instances of this! Use the static helpers only.");
}, klass = PipelineD, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var DocumentSource = require('./documentSources/DocumentSource'),
	CursorDocumentSource = require('./documentSources/CursorDocumentSource'),
	Cursor = require('../Cursor');

/**
 * Create a Cursor wrapped in a DocumentSourceCursor, which is suitable to be the first source for a pipeline to begin with.
 * This source will feed the execution of the pipeline.
 *
 * //NOTE: DEVIATION FROM THE MONGO: We don't have special optimized cursors; You could support something similar by overriding `Pipeline#run` to call `DocumentSource#coalesce` on the `inputSource` if you really need it.
 *
 * This method looks for early pipeline stages that can be folded into
 * the underlying cursor, and when a cursor can absorb those, they
 * are removed from the head of the pipeline.  For example, an
 * early match can be removed and replaced with a Cursor that will
 * do an index scan.
 *
 * @param pipeline  {Pipeline}  the logical "this" for this operation
 * @param ctx       {Object}    Context for expressions
 * @returns	{CursorDocumentSource}	the cursor that was created
**/
klass.prepareCursorSource = function prepareCursorSource(pipeline, /*dbName,*/ expCtx){

	var sources = pipeline.sourceVector;

	//NOTE: SKIPPED: look for initial match
	//NOTE: SKIPPED: create a query object

	//Look for an initial simple project; we'll avoid constructing Values for fields that won't make it through the projection
	var projection = {};
	var deps = [];
	var status = DocumentSource.GetDepsReturn.SEE_NEXT;
	for (var i=0; i < sources.length && status != DocumentSource.GetDepsReturn.EXHAUSTIVE; i++) {
		status = sources[i].getDependencies(deps);
	}
	if (status == DocumentSource.GetDepsReturn.EXHAUSTIVE) {
		projection = DocumentSource.depsToProjection(deps);
	}

	//NOTE: SKIPPED: Look for an initial sort
	//NOTE: SKIPPED: Create the sort object

//	//get the full "namespace" name
//	var fullName = dbName + "." + pipeline.collectionName;

	//NOTE: SKIPPED: if(DEV) log messages

	//Create the necessary context to use a Cursor
	//NOTE: SKIPPED: pSortedCursor bit
	//NOTE: SKIPPED: pUnsortedCursor bit
	var cursorWithContext = new CursorDocumentSource.CursorWithContext(/*fullName*/);

	// Now add the Cursor to cursorWithContext
	cursorWithContext._cursor = new Cursor( pipeline.collectionName );

	// wrap the cursor with a DocumentSource and return that
	var source = new CursorDocumentSource( cursorWithContext, expCtx );

//	source.namespace = fullName;

	//NOTE: SKIPPED: Note the query and sort

	if (Object.keys(projection).length) source.setProjection(projection);

	return source;
};

},{"../Cursor":1,"./documentSources/CursorDocumentSource":18,"./documentSources/DocumentSource":19}],7:[function(require,module,exports){
"use strict";

/**
 * Represents a `Value` (i.e., an `Object`) in `mongo` but in `munge` this is only a set of static helpers since we treat all `Object`s like `Value`s.
 * @class Value
 * @namespace mungedb-aggregate.pipeline
 * @module mungedb-aggregate
 * @constructor
 **/
var Value = module.exports = function Value(){
	if(this.constructor == Value) throw new Error("Never create instances of this! Use the static helpers only.");
}, klass = Value, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// PRIVATE STUFF
function getTypeVerifier(type, IClass, isStrict) {
	return function verifyType(value) {
		if (typeof(value) != type) throw new Error("typeof value is not: " + type + "; actual: " + typeof(value));
		if (typeof(IClass) == "function" && !(isStrict ? value.constructor == IClass : value instanceof IClass)) throw new Error("instanceof value is not: " + IClass.name + "; actual: " + value.constructor.name);
		return value;
	};
}

// STATIC MEMBERS
klass.verifyNumber = getTypeVerifier("number", Number);	//NOTE: replaces #getDouble(), #getInt(), and #getLong()
klass.verifyString = getTypeVerifier("string", String);
klass.verifyDocument = getTypeVerifier("object", Object, true);	//TODO: change to verifyObject? since we're not using actual Document instances
klass.verifyArray = getTypeVerifier("object", Array, true);
klass.verifyDate = getTypeVerifier("object", Date, true);
klass.verifyRegExp = getTypeVerifier("object", RegExp, true);	//NOTE: renamed from #getRegex()
//TODO:	klass.verifyOid = ...?
//TODO:	klass.VerifyTimestamp = ...?
klass.verifyBool = getTypeVerifier("boolean", Boolean, true);

klass.coerceToBool = function coerceToBool(value) {
	if (typeof(value) == "string") return true;
	return !!value;	// including null or undefined
};
klass.coerceToInt =
klass.coerceToLong =
klass.coerceToDouble =
klass._coerceToNumber = function _coerceToNumber(value) { //NOTE: replaces .coerceToInt(), .coerceToLong(), and .coerceToDouble()
	if (value === null) return 0;
	switch (typeof(value)) {
	case "undefined":
		return 0;
	case "number":
		return value;
	case "object":
		switch (value.constructor.name) {
			case "Long":
				return parseInt(value.toString(), 10);
			case "Double":
				return parseFloat(value.value, 10);
			default:
				throw new Error("can't convert from BSON type " + value.constructor.name + " to int; codes 16003, 16004, 16005");
		}
		return value;
	default:
		throw new Error("can't convert from BSON type " + typeof(value) + " to int; codes 16003, 16004, 16005");
	}
};
klass.coerceToDate = function coerceToDate(value) {
	//TODO: Support Timestamp BSON type?
	if (value instanceof Date) return value;
	throw new Error("can't convert from BSON type " + typeof(value) + " to Date; uassert code 16006");
};
//TODO: klass.coerceToTimeT = ...?   try to use as Date first rather than having coerceToDate return Date.parse  or dateObj.getTime() or similar
//TODO:	klass.coerceToTm = ...?
klass.coerceToString = function coerceToString(value) {
	if (value === null) return "";
	switch (typeof(value)) {
	case "undefined":
		return "";
	case "number":
		return value.toString();
	case "string":
		return value;
	default:
		throw new Error("can't convert from BSON type " + typeof(value) + " to String; uassert code 16007");
	}
};


klass.canonicalize = function canonicalize(x) {
	var xType = typeof(x);
	if(xType == "object") xType = x === null ? "null" : x.constructor.name;
	switch (xType) {
		case "MinKey":
			return -1;
		case "MaxKey":
			return 127;
		case "EOO":
		case "undefined":
		case undefined:
			return 0;
		case "jstNULL":
		case "null":
		case "Null":
			return 5;
		case "NumberDouble":
		case "NumberInt":
		case "NumberLong":
		case "number":
			return 10;
		case "Symbol":
		case "string":
			return 15;
		case "Object":
			return 20;
		case "Array":
			return 25;
		case "Binary":
			return 30;
		case "ObjectId":
			return 35;
		case "ObjectID":
			return 35;
		case "boolean":
		case "Boolean":
			return 40;
		case "Date":
		case "Timestamp":
			return 45;
		case "RegEx":
		case "RegExp":
			return 50;
		case "DBRef":
			return 55;
		case "Code":
			return 60;
		case "CodeWScope":
			return 65;
		default:
			// Default value for Object
			return 20;  
	}
};

klass.cmp = function cmp(l, r){
	return l < r ? -1 : l > r ? 1 : 0;
};

//TODO:	klass.coerceToTimestamp = ...?

/**
 * Compare two Values.
 *
 * @static
 * @method compare
 * @param rL left value
 * @param rR right value
 * @returns an integer less than zero, zero, or an integer greater than zero, depending on whether rL < rR, rL == rR, or rL > rR
 **/
var Document;  // loaded lazily below //TODO: a dirty hack; need to investigate and clean up
klass.compare = function compare(l, r) {
	//NOTE: deviation from mongo code: we have to do some coercing for null "types" because of javascript
	var lt = l === null ? "null" : typeof(l),
		rt = r === null ? "null" : typeof(r),
		ret;

	// NOTE: deviation from mongo code: javascript types do not work quite the same, so for proper results we always canonicalize, and we don't need the "speed" hack
	ret = (klass.cmp(klass.canonicalize(l), klass.canonicalize(r)));

	if(ret !== 0) return ret;

	// Numbers
	if (lt === "number" && rt === "number"){
		//NOTE: deviation from Mongo code: they handle NaN a bit differently
		if (isNaN(l)) return isNaN(r) ? 0 : -1;
		if (isNaN(r)) return 1;
		return klass.cmp(l,r);
	}

	// CW TODO for now, only compare like values
	if (lt !== rt) throw new Error("can't compare values of BSON types [" + lt + " " + l.constructor.name + "] and [" + rt + ":" + r.constructor.name + "]; code 16016");
	// Compare everything else
	switch (lt) {
	case "number":
		throw new Error("number types should have been handled earlier!");
	case "string":
		return klass.cmp(l,r);
	case "boolean":
		return l == r ? 0 : l ? 1 : -1;
	case "undefined": //NOTE: deviation from mongo code: we are comparing null to null or undefined to undefined (otherwise the ret stuff above would have caught it)
	case "null":
		return 0;
	case "object":
		if (l instanceof Array) {
			for (var i = 0, ll = l.length, rl = r.length; true ; ++i) {
				if (i > ll) {
					if (i > rl) return 0; // arrays are same length
					return -1; // left array is shorter
				}
				if (i > rl) return 1; // right array is shorter
				var cmp = Value.compare(l[i], r[i]);
				if (cmp !== 0) return cmp;
			}

			throw new Error("logic error in Value.compare for Array types!");
		}
		if (l instanceof Date) return klass.cmp(l,r);
		if (l instanceof RegExp) return klass.cmp(l,r);
		if (Document === undefined) Document = require("./Document");	//TODO: a dirty hack; need to investigate and clean up
		return Document.compare(l, r);
	default:
		throw new Error("unhandled left hand type:" + lt);
	}

};

//TODO:	klass.hashCombine = ...?
//TODO:	klass.getWidestNumeric = ...?
//TODO:	klass.getApproximateSize = ...?
//TODO:	klass.addRef = ...?
//TODO:	klass.release = ...?

},{"./Document":3}],8:[function(require,module,exports){
"use strict";

/** 
 * A base class for all pipeline accumulators. Uses NaryExpression as a base class.
 *
 * @class Accumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var Accumulator = module.exports = function Accumulator(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = Accumulator, base = require("../expressions/NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
// var Value = require("../Value"),

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

/**
 * Adds the operand after checking the current limit
 * The equal is there because it checks *before* adding the requested argument.
 * Cannot use checkArgLimit because Accumulator must return a different error code.
 *
 * @param expr the operand to add
 **/
proto.addOperand = function addOperand(expr) {
	if (this.operands.length >= 1) throw new Error("code 15943; group accumulator " + this.getOpName() + " only accepts one operand");
	base.prototype.addOperand.call(this, expr);
};

proto.toJSON = function toJSON(isExpressionRequired){
	var rep = {};
	rep[this.getOpName()] = this.operands[0].toJSON(isExpressionRequired);
	return rep;
};

/**
 * Convenience method for doing this for accumulators.  The pattern
 * is always the same, so a common implementation works, but requires
 * knowing the operator name.
 *
 * @param {Object} pBuilder the builder to add to
 * @param {String} fieldName the projected name
 * @param {String} opName the operator name
 * @param {Boolean} requireExpression pass down if the expression is needed
 **/
//	proto.opToBson = function opToBson(pBuilder, opName, fieldName, requireExpression) {
//		if (this.operands.length == 1) throw new Error("this should never happen");
//		var builder = new BSONObjBuilder();
//		this.operands[0].addToBsonObj(builder, opName, requireExpression);
//		pBuilder.append(fieldName, builder.done());
//	};

/**
 * Wrapper around opToBson
 *
 * @param {Object} pBuilder the builder to add to
 * @param {String} fieldName the projected name
 * @param {Boolean} requireExpression pass down if the expression is needed
 **/
//	proto.addToBsonObj = function addToBsonObj(pBuilder, fieldName, requireExpression) {
//		this.opToBson(pBuilder, this.getOpName(), fieldName, requireExpression);
//	};

/**
 * Make sure that nobody adds an accumulator to an array
 *
 * @param {Object} pBuilder the builder to add to
 **/
proto.addToBsonArray = function addToBsonArray(pBuilder) {
	if (false) throw new Error("this should never happen"); // these can't appear in arrays
};

/** 
 * If this function is not overridden in the sub classes,
 * then throw an error
 *
 **/
proto.getValue = function getValue() {
	throw new Error("You need to define this function on your accumulator");
};

},{"../expressions/NaryExpression":49}],9:[function(require,module,exports){
"use strict";

/** 
 * Create an expression that finds the sum of n operands.
 * @class AddSoSetAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
**/
var AddToSetAccumulator = module.exports = function AddToSetAccumulator(/* ctx */){
	if (arguments.length !== 0) throw new Error("zero args expected");
	this.set = {};
	//this.itr = undefined; /* Shoudln't need an iterator for the set */
	//this.ctx = undefined; /* Not using the context object currently as it is related to sharding */
	base.call(this);
}, klass = AddToSetAccumulator, Accumulator = require("./Accumulator"), base = Accumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$addToSet";
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

proto.evaluate = function evaluate(doc) {
	if (arguments.length !== 1) throw new Error("One and only one arg expected");
	var rhs = this.operands[0].evaluate(doc);
	if (rhs === undefined) return;
	this.set[JSON.stringify(rhs)] = rhs;
};

proto.getValue = function getValue() {
	var setValues = [];
	for (var setKey in this.set) {
		setValues.push(this.set[setKey]);
	}
	return setValues;
};

},{"./Accumulator":8}],10:[function(require,module,exports){
"use strict";

/** 
 * A class for constructing accumulators to calculate avg.
 * @class AvgAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var AvgAccumulator = module.exports = function AvgAccumulator(){
	this.subTotalName = "subTotal";
	this.countName = "count";
	this.totalIsANumber = true;
	base.call(this);
}, klass = AvgAccumulator, SumAccumulator = require("./SumAccumulator"), base = SumAccumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

proto.getValue = function getValue(){
	if (this.totalIsANumber && this.count > 0) {
		return this.total / this.count;
	} else if (this.count === 0) {
		return 0;
	} else {
		throw new Error("$sum resulted in a non-numeric type");
	}
};

proto.getOpName = function getOpName(){
	return "$avg";
};

},{"./SumAccumulator":16}],11:[function(require,module,exports){
"use strict";

/** 
 * Constructor for FirstAccumulator, wraps SingleValueAccumulator's constructor and adds flag to track whether we have started or not
 * @class FirstAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var FirstAccumulator = module.exports = function FirstAccumulator(){
	base.call(this);
	this.started = 0; //TODO: hack to get around falsy values making us keep going
}, klass = FirstAccumulator, base = require("./SingleValueAccumulator"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$first";
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

/** 
 * Takes a document and returns the first value in the document
 * @param {Object} doc the document source
 * @return the first value
 **/
proto.evaluate = function evaluate(doc){
	if (this.operands.length != 1) throw new Error("this should never happen");

	// only remember the first value seen
	if (!base.prototype.getValue.call(this) && this.started === 0) {
		this.value = this.operands[0].evaluate(doc);
		this.started = 1;
	}

	return this.value;
};

},{"./SingleValueAccumulator":15}],12:[function(require,module,exports){
"use strict";

/** 
 * Constructor for LastAccumulator, wraps SingleValueAccumulator's constructor and finds the last document
 * @class LastAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var LastAccumulator = module.exports = function LastAccumulator(){
	base.call(this);
}, klass = LastAccumulator, SingleValueAccumulator = require("./SingleValueAccumulator"), base = SingleValueAccumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

proto.evaluate = function evaluate(doc){
	if (this.operands.length != 1) throw new Error("this should never happen");
	this.value = this.operands[0].evaluate(doc);
};

proto.getOpName = function getOpName(){
	return "$last";
};

},{"./SingleValueAccumulator":15}],13:[function(require,module,exports){
"use strict";

/** 
 * Constructor for MinMaxAccumulator, wraps SingleValueAccumulator's constructor and adds flag to track whether we have started or not
 * @class MinMaxAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var MinMaxAccumulator = module.exports = function MinMaxAccumulator(sense){
	if (arguments.length > 1) throw new Error("expects a single value");
	base.call(this);
	this.sense = sense; /* 1 for min, -1 for max; used to "scale" comparison */
	if (this.sense !== 1 && this.sense !== -1) throw new Error("this should never happen");
}, klass = MinMaxAccumulator, base = require("./SingleValueAccumulator"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	if (this.sense == 1) return "$min";
	return "$max";
};

klass.createMin = function createMin(){
	return new MinMaxAccumulator(1);
};

klass.createMax = function createMax(){
	return new MinMaxAccumulator(-1);
};

/** 
 * Takes a document and returns the first value in the document
 * @param {Object} doc the document source
 * @return the first value
 **/
proto.evaluate = function evaluate(doc){
	if (this.operands.length != 1) throw new Error("this should never happen");
	var prhs = this.operands[0].evaluate(doc);

	// if this is the first value, just use it
	if (!this.hasOwnProperty('value')) {
		this.value = prhs;
	} else {
		// compare with the current value; swap if appropriate
		var cmp = Value.compare(this.value, prhs) * this.sense;
		if (cmp > 0) this.value = prhs;
	}

	return this.value;
};

},{"../Value":7,"./SingleValueAccumulator":15}],14:[function(require,module,exports){
"use strict";

/** 
 * Constructor for PushAccumulator. Pushes items onto an array.
 * @class PushAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var PushAccumulator = module.exports = function PushAccumulator(){
	this.values = [];
	base.call(this);
}, klass = PushAccumulator, Accumulator = require("./Accumulator"), base = Accumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

proto.evaluate = function evaluate(doc){
	if (this.operands.length != 1) throw new Error("this should never happen");
	var v = this.operands[0].evaluate(doc);
	if (v !== undefined) this.values.push(v);
	return null;
};

proto.getValue = function getValue(){
	return this.values;
};

proto.getOpName = function getOpName(){
	return "$push";
};

},{"./Accumulator":8}],15:[function(require,module,exports){
"use strict";

/**
 * This isn't a finished accumulator, but rather a convenient base class
 * for others such as $first, $last, $max, $min, and similar.  It just
 * provides a holder for a single Value, and the getter for that.  The
 * holder is protected so derived classes can manipulate it.
 *
 * @class SingleValueAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
**/
var SingleValueAccumulator = module.exports = function SingleValueAccumulator(){
	if (arguments.length > 1) throw new Error("expects a single value");
	base.call(this);
}, klass = SingleValueAccumulator, Accumulator = require("./Accumulator"), base = Accumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

proto.getValue = function getValue(){
	return this.value;
};

},{"../Value":7,"./Accumulator":8}],16:[function(require,module,exports){
"use strict";

/** 
 * Accumulator for summing a field across documents
 * @class SumAccumulator
 * @namespace mungedb-aggregate.pipeline.accumulators
 * @module mungedb-aggregate
 * @constructor
 **/
var SumAccumulator = module.exports = function SumAccumulator(){
	this.total = 0;
	this.count = 0;
	this.totalIsANumber = true;
	base.call(this);
}, klass = SumAccumulator, Accumulator = require("./Accumulator"), base = Accumulator, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

proto.evaluate = function evaluate(doc){
	if (this.operands.length != 1) throw new Error("this should never happen");
	var v = this.operands[0].evaluate(doc);

	if (typeof v !== "number") { // do nothing with non-numeric types
		return 0;
	} else {
		this.totalIsANumber = true;
		this.total += v;
	}
	this.count++;

	return 0;
};

proto.getValue = function getValue(){
	if (this.totalIsANumber) {
		return this.total;
	}
	throw new Error("$sum resulted in a non-numeric type");
};

proto.getOpName = function getOpName(){
	return "$sum";
};

},{"./Accumulator":8}],17:[function(require,module,exports){
"use strict";
module.exports = {
	Accumulator: require("./Accumulator"),
	AddToSet: require("./AddToSetAccumulator"),
	Avg: require("./AvgAccumulator"),
	First: require("./FirstAccumulator"),
	Last: require("./LastAccumulator"),
	MinMax: require("./MinMaxAccumulator"),
	Push: require("./PushAccumulator"),
	Sum: require("./SumAccumulator")
};

},{"./Accumulator":8,"./AddToSetAccumulator":9,"./AvgAccumulator":10,"./FirstAccumulator":11,"./LastAccumulator":12,"./MinMaxAccumulator":13,"./PushAccumulator":14,"./SumAccumulator":16}],18:[function(require,module,exports){
(function (process){
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

}).call(this,require('_process'))
},{"./DocumentSource":19,"_process":65}],19:[function(require,module,exports){
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
 * Is the source at EOF?
 * @method	eof
 **/
proto.eof = function eof() {
	throw new Error("not implemented");
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
	//pExpCtx->checkForInterrupt(); // might not return
	return false;
};

/**
 * some implementations do the equivalent of verify(!eof()) so check eof() first
 * @method	getCurrent
 * @returns	{Document}	the current Document without advancing
 **/
proto.getCurrent = function getCurrent() {
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
proto.setSource = function setSource(theSource, callback) {
	if (this.source) throw new Error("It is an error to set the source more than once");
	this.source = theSource;
	if (callback) return setTimeout(callback, 0);
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
	var bb = {};
	if (deps._id === undefined)
		bb._id = 0;

	var last = "";
	Object.keys(deps).sort().forEach(function(it){
		if (last !== "" && it.slice(0, last.length) === last){
			// we are including a parent of *it so we don't need to
			// include this field explicitly. In fact, due to
			// SERVER-6527 if we included this field, the parent
			// wouldn't be fully included.
			return;
		}
		last = it + ".";
		bb[it] = 1;
	});

	return bb;
};

/**
 * Add the DocumentSource to the array builder.
 * The default implementation calls sourceToJson() in order to
 * convert the inner part of the object which will be added to the
 * array being built here.
 *
 * @method	addToJsonArray
 * @param	{Array} pBuilder	JSONArrayBuilder: the array builder to add the operation to.
 * @param	{Boolean}	explain	create explain output
 * @returns	{Object}
 **/
proto.addToJsonArray = function addToJsonArray(pBuilder, explain) {
	pBuilder.push(this.sourceToJson({}, explain));
};

/**
 * Create an object that represents the document source.  The object
 * will have a single field whose name is the source's name.  This
 * will be used by the default implementation of addToJsonArray()
 * to add this object to a pipeline being represented in JSON.
 *
 * @method	sourceToJson
 * @param	{Object} pBuilder	JSONObjBuilder: a blank object builder to write to
 * @param	{Boolean}	explain	create explain output
 **/
proto.sourceToJson = function sourceToJson(pBuilder, explain) {
	throw new Error("not implemented");
};

/**
 * Convert the DocumentSource instance to it's JSON Object representation; Used by the standard JSON.stringify() function
 * @method toJSON
 * @return {String} a JSON-encoded String that represents the DocumentSource
 **/
proto.toJSON = function toJSON(){
	var obj = {};
	this.sourceToJson(obj);
	return obj;
};

},{}],20:[function(require,module,exports){
"use strict";

/**
 * A base class for filter document sources
 * @class FilterBaseDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [ctx] {ExpressionContext}
 **/
var FilterBaseDocumentSource = module.exports = function FilterBaseDocumentSource(ctx){
	if (arguments.length > 1) throw new Error("up to one arg expected");
	base.call(this, ctx);
	this.unstarted = true;
	this.hasNext = false;
	this.current = null;
}, klass = FilterBaseDocumentSource, base = require('./DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

//TODO: Need to implement coalesce()
//TODO: Need to implement optimize()

/**
 * Find the next acceptable source document, if there are any left.
 * @method findNext
 **/
proto.findNext = function findNext() {
	/* only do this the first time */
	if (this.unstarted) {
		this.hasNext = !this.source.eof();
		this.unstarted = false;
	}

	while(this.hasNext) {
		var document = this.source.getCurrent();
		this.hasNext = this.source.advance();

		if (this.accept(document)) {
			this.current = document;
			return;
		}
	}

	this.current = null;
};

/**
 * Is the source at EOF?
 * @method	eof
 **/
proto.eof = function eof() {
	if (this.unstarted)
		this.findNext();
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

	if (this.unstarted)
		this.findNext();

	/**
	* This looks weird after the above, but is correct.  Note that calling
	* getCurrent() when first starting already yields the first document
	* in the collection.  Calling advance() without using getCurrent()
	* first will skip over the first item.
	**/
	this.findNext();
	return (this.current !== null);
};

/**
 * some implementations do the equivalent of verify(!eof()) so check eof() first
 * @method	getCurrent
 * @returns	{Document}	the current Document without advancing
 **/
proto.getCurrent = function getCurrent() {
	if (this.unstarted)
		this.findNext();
	if (this.current === null) throw new Error("This should never happen");
	return this.current;
};

/**
* Test the given document against the predicate and report if it should be accepted or not.
* @param {object} document the document to test
* @returns {bool} true if the document matches the filter, false otherwise
**/
proto.accept = function accept(document) {
	throw new Error("not implemented");
};

/**
* Create a JSONObj suitable for Matcher construction.
*
* This is used after filter analysis has moved as many filters to
* as early a point as possible in the document processing pipeline.
* See db/Matcher.h and the associated wiki documentation for the
* format.  This conversion is used to move back to the low-level
* find() Cursor mechanism.
*
* @param builder the builder to write to
**/
proto.toMatcherJson = function toMatcherJson(builder) {
	throw new Error("not implemented");
};

},{"./DocumentSource":19}],21:[function(require,module,exports){
"use strict";
var DocumentSource = require("./DocumentSource"),
	Accumulators = require("../accumulators/"),
	Document = require("../Document"),
	Expression = require("../expressions/Expression"),
	ConstantExpression = require("../expressions/ConstantExpression"),
	FieldPathExpression = require("../expressions/FieldPathExpression");


/**
 * A class for grouping documents together
 * @class GroupDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [ctx] {ExpressionContext}
 **/
var GroupDocumentSource = module.exports = function GroupDocumentSource(expCtx) {
	if (arguments.length > 1) throw new Error("up to one arg expected");
	base.call(this, expCtx);

	this.populated = false;
	this.idExpression = null;
	this.groups = {}; // GroupsType Value -> Accumulators[]
	this.groupsKeys = []; // This is to faciliate easier look up of groups
	this.originalGroupsKeys = []; // This stores the original group key un-hashed/stringified/whatever

	this.fieldNames = [];
	this.accumulatorFactories = [];
	this.expressions = [];
	this.currentDocument = null;
	this.currentGroupsKeysIndex = 0;

}, klass = GroupDocumentSource, base = DocumentSource, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.groupOps = {
	"$addToSet": Accumulators.AddToSet,
	"$avg": Accumulators.Avg,
	"$first": Accumulators.First,
	"$last": Accumulators.Last,
	"$max": Accumulators.MinMax.createMax,
	"$min": Accumulators.MinMax.createMin,
	"$push": Accumulators.Push,
	"$sum": Accumulators.Sum
};

klass.groupName = "$group";

proto.getSourceName = function getSourceName() {
	return klass.groupName;
};

/**
 * Create an object that represents the document source.  The object
 * will have a single field whose name is the source's name.  This
 * will be used by the default implementation of addToJsonArray()
 * to add this object to a pipeline being represented in JSON.
 *
 * @method	sourceToJson
 * @param	{Object} builder	JSONObjBuilder: a blank object builder to write to
 * @param	{Boolean}	explain	create explain output
 **/
proto.sourceToJson = function sourceToJson(builder, explain) {
	var idExp = this.idExpression,
		insides = {
			_id: idExp ? idExp.toJSON() : {}
		},
		aFac = this.accumulatorFactories,
		aFacLen = aFac.length;

	for(var i=0; i < aFacLen; ++i) {
		var acc = new aFac[i](/*pExpCtx*/);
		acc.addOperand(this.expressions[i]);

		insides[this.fieldNames[i]] = acc.toJSON(true);
	}

	builder[this.getSourceName()] = insides;
};

klass.createFromJson = function createFromJson(groupObj, ctx) {
	if (!(groupObj instanceof Object && groupObj.constructor === Object)) throw new Error("a group's fields must be specified in an object");

	var idSet = false,
		group = new GroupDocumentSource(ctx);

	for (var groupFieldName in groupObj) {
		if (groupObj.hasOwnProperty(groupFieldName)) {
			var groupField = groupObj[groupFieldName];

			if (groupFieldName === "_id") {

				if(idSet) throw new Error("15948 a group's _id may only be specified once");

				if (groupField instanceof Object && groupField.constructor === Object) {
					var objCtx = new Expression.ObjectCtx({isDocumentOk:true});
					group.idExpression = Expression.parseObject(groupField, objCtx);
					idSet = true;

				} else if (typeof groupField === "string") {
					if (groupField[0] !== "$") {
						group.idExpression = new ConstantExpression(groupField);
					} else {
						var pathString = Expression.removeFieldPrefix(groupField);
						group.idExpression = new FieldPathExpression(pathString);
					}
					idSet = true;

				} else {
					var typeStr = group._getTypeStr(groupField);
					switch (typeStr) {
						case "number":
						case "string":
						case "boolean":
						case "Object":
						case "object": // null returns "object" Xp
						case "Array":
							group.idExpression = new ConstantExpression(groupField);
							idSet = true;
							break;
						default:
							throw new Error("a group's _id may not include fields of type " + typeStr  + "");
					}
				}


			} else {
				if (groupFieldName.indexOf(".") !== -1) throw new Error("16414 the group aggregate field name '" + groupFieldName + "' cannot contain '.'");
				if (groupFieldName[0] === "$") throw new Error("15950 the group aggregate field name '" + groupFieldName + "' cannot be an operator name");
				if (group._getTypeStr(groupFieldName) === "Object") throw new Error("15951 the group aggregate field '" + groupFieldName + "' must be defined as an expression inside an object");

				var subFieldCount = 0;
				for (var subFieldName in groupField) {
					if (groupField.hasOwnProperty(subFieldName)) {
						var subField = groupField[subFieldName],
							op = klass.groupOps[subFieldName];
						if (!op) throw new Error("15952 unknown group operator '" + subFieldName + "'");

						var groupExpression,
							subFieldTypeStr = group._getTypeStr(subField);
						if (subFieldTypeStr === "Object") {
							var subFieldObjCtx = new Expression.ObjectCtx({isDocumentOk:true});
							groupExpression = Expression.parseObject(subField, subFieldObjCtx);
						} else if (subFieldTypeStr === "Array") {
							throw new Error("15953 aggregating group operators are unary (" + subFieldName + ")");
						} else {
							groupExpression = Expression.parseOperand(subField);
						}
						group.addAccumulator(groupFieldName,op, groupExpression);

						++subFieldCount;
					}
				}
				if (subFieldCount != 1) throw new Error("15954 the computed aggregate '" + groupFieldName + "' must specify exactly one operator");
			}
		}
	}

	if (!idSet) throw new Error("15955 a group specification must include an _id");

	return group;
};

proto._getTypeStr = function _getTypeStr(obj) {
	var typeofStr = typeof obj,
		typeStr = (typeofStr == "object" && obj !== null) ? obj.constructor.name : typeofStr;
	return typeStr;
};

proto.advance = function advance() {
	base.prototype.advance.call(this); // Check for interupts ????
	if(!this.populated) this.populate();

	//verify(this.currentGroupsKeysIndex < this.groupsKeys.length);

	++this.currentGroupsKeysIndex;
	if (this.currentGroupsKeysIndex >= this.groupsKeys.length) {
		this.currentDocument = null;
		return false;
	}

	this.currentDocument = this.makeDocument(this.currentGroupsKeysIndex);
	return true;
};

proto.eof = function eof() {
	if (!this.populated) this.populate();
	return this.currentGroupsKeysIndex === this.groupsKeys.length;
};

proto.getCurrent = function getCurrent() {
	if (!this.populated) this.populate();
	return this.currentDocument;
};

proto.getDependencies = function getDependencies(deps) {
	var self = this;
	// add _id
	this.idExpression.addDependencies(deps);
	// add the rest
	this.fieldNames.forEach(function (field, i) {
		self.expressions[i].addDependencies(deps);
	});

	return DocumentSource.GetDepsReturn.EXHAUSTIVE;
};

proto.addAccumulator = function addAccumulator(fieldName, accumulatorFactory, expression) {
	this.fieldNames.push(fieldName);
	this.accumulatorFactories.push(accumulatorFactory);
	this.expressions.push(expression);
};

proto.populate = function populate() {
	for (var hasNext = !this.source.eof(); hasNext; hasNext = this.source.advance()) {
		var group,
			currentDocument = this.source.getCurrent(),
			_id = this.idExpression.evaluate(currentDocument);

		if (undefined === _id) _id = null;

		var idHash = JSON.stringify(_id); //TODO: USE A REAL HASH.  I didn't have time to take collision into account.

		if (idHash in this.groups) {
			group = this.groups[idHash];
		} else {
			this.groups[idHash] = group = [];
			this.groupsKeys[this.currentGroupsKeysIndex] = idHash;
			this.originalGroupsKeys[this.currentGroupsKeysIndex] = (_id && typeof _id === 'object') ? Document.clone(_id) : _id;
			++this.currentGroupsKeysIndex;
			for (var ai = 0; ai < this.accumulatorFactories.length; ++ai) {
				var accumulator = new this.accumulatorFactories[ai]();
				accumulator.addOperand(this.expressions[ai]);
				group.push(accumulator);
			}
		}


		// tickle all the accumulators for the group we found
		for (var gi = 0; gi < group.length; ++gi) {
			group[gi].evaluate(currentDocument);
		}

	}

	this.currentGroupsKeysIndex = 0; // Start the group
	if (this.groupsKeys.length > 0) {
		this.currentDocument = this.makeDocument(this.currentGroupsKeysIndex);
	}
	this.populated = true;

};

proto.makeDocument = function makeDocument(groupKeyIndex) {
	var groupKey = this.groupsKeys[groupKeyIndex],
		originalGroupKey = this.originalGroupsKeys[groupKeyIndex],
		group = this.groups[groupKey],
		doc = {};

	doc[Document.ID_PROPERTY_NAME] = originalGroupKey;

	for (var i = 0; i < this.fieldNames.length; ++i) {
		var fieldName = this.fieldNames[i],
			item = group[i];
		if (item !== "null" && item !== undefined) {
			doc[fieldName] = item.getValue();
		}
	}

	return doc;
};

},{"../Document":3,"../accumulators/":17,"../expressions/ConstantExpression":35,"../expressions/Expression":40,"../expressions/FieldPathExpression":41,"./DocumentSource":19}],22:[function(require,module,exports){
"use strict";

/**
 * A document source limiter
 * @class LimitDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [ctx] {ExpressionContext}
 **/
var LimitDocumentSource = module.exports = function LimitDocumentSource(ctx){
	if (arguments.length > 1) throw new Error("up to one arg expected");
	base.call(this, ctx);
	this.limit = 0;
	this.count = 0;
}, klass = LimitDocumentSource, base = require('./DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.limitName = "$limit";

proto.getSourceName = function getSourceName(){
	return klass.limitName;
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

/**
 * Coalesce limits together
 * @param {Object} nextSource the next source
 * @return {bool} return whether we can coalese together
 **/
proto.coalesce = function coalesce(nextSource) {
	var nextLimit =	nextSource.constructor === LimitDocumentSource?nextSource:null;

	// if it's not another $limit, we can't coalesce
	if (!nextLimit) return false;
	
	// we need to limit by the minimum of the two limits
	if (nextLimit.limit < this.limit) this.limit = nextLimit.limit;

	return true;
};

/**
 * Is the source at EOF?
 * @method	eof
 **/
proto.eof = function eof() {
	return this.source.eof() || this.count >= this.limit;
};

/**
 * some implementations do the equivalent of verify(!eof()) so check eof() first
 * @method	getCurrent
 * @returns	{Document}	the current Document without advancing
 **/
proto.getCurrent = function getCurrent() {
	return this.source.getCurrent();
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
	++this.count;
	if (this.count >= this.limit) {
		return false;
	}
	this.current = this.source.getCurrent();
	return this.source.advance();
};

/**
 * Create an object that represents the document source.  The object
 * will have a single field whose name is the source's name.  This
 * will be used by the default implementation of addToJsonArray()
 * to add this object to a pipeline being represented in JSON.
 *
 * @method	sourceToJson
 * @param	{Object} builder	JSONObjBuilder: a blank object builder to write to
 * @param	{Boolean}	explain	create explain output
 **/
proto.sourceToJson = function sourceToJson(builder, explain) {
	builder.$limit = this.limit;
};

/**
 * Creates a new LimitDocumentSource with the input number as the limit
 * @param {Number} JsonElement this thing is *called* Json, but it expects a number
 **/
klass.createFromJson = function createFromJson(jsonElement, ctx) {
	if (typeof jsonElement !== "number") throw new Error("code 15957; the limit must be specified as a number");

	var Limit = proto.getFactory(),
		nextLimit = new Limit(ctx);

	nextLimit.limit = jsonElement;
	if ((nextLimit.limit <= 0) || isNaN(nextLimit.limit)) throw new Error("code 15958; the limit must be positive");

	return nextLimit;
};

},{"./DocumentSource":19}],23:[function(require,module,exports){
"use strict";
var sift = require("sift");	//TODO: DEVIATION FROM MONGO: this was a temporary hack to get this done quickly but it is too inconsistent to keep; need a real port of MatchDocumentSource

/**
 * A match document source built off of FilterBaseDocumentSource
 *
 * NOTE: THIS IS A DEVIATION FROM THE MONGO IMPLEMENTATION.
 * TODO: internally uses `sift` to fake it, which has bugs, so we need to reimplement this by porting the MongoDB implementation
 *
 * @class MatchDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param {Object} query the match query to use
 * @param [ctx] {ExpressionContext}
 **/
var MatchDocumentSource = module.exports = function MatchDocumentSource(query, ctx){
	if (arguments.length > 2) throw new Error("up to two args expected");
	if (!query) throw new Error("arg `query` is required");
	base.call(this, ctx);
	this.query = query; // save the query, so we can check it for deps later. THIS IS A DEVIATION FROM THE MONGO IMPLEMENTATION
	this.matcher = sift(query);
}, klass = MatchDocumentSource, base = require('./FilterBaseDocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.matchName = "$match";

proto.getSourceName = function getSourceName(){
	return klass.matchName;
};

/**
 * Create an object that represents the document source.  The object
 * will have a single field whose name is the source's name.  This
 * will be used by the default implementation of addToJsonArray()
 * to add this object to a pipeline being represented in JSON.
 *
 * @method	sourceToJson
 * @param	{Object} builder	JSONObjBuilder: a blank object builder to write to
 * @param	{Boolean}	explain	create explain output
 **/
proto.sourceToJson = function sourceToJson(builder, explain) {
	builder[this.getSourceName()] = this.matcher.query;
};

/**
 *  Test the given document against the predicate and report if it should be accepted or not.
 * @param {object} document the document to test
 * @returns {bool} true if the document matches the filter, false otherwise
 **/
proto.accept = function accept(document) {
	/**
	* The matcher only takes BSON documents, so we have to make one.
	*
	* LATER
	* We could optimize this by making a document with only the
	* fields referenced by the Matcher.  We could do this by looking inside
	* the Matcher's BSON before it is created, and recording those.  The
	* easiest implementation might be to hold onto an ExpressionDocument
	* in here, and give that pDocument to create the created subset of
	* fields, and then convert that instead.
	**/
	return this.matcher.test(document);
};

/**
 * Create a JSONObj suitable for Matcher construction.
 *
 * This is used after filter analysis has moved as many filters to
 * as early a point as possible in the document processing pipeline.
 * See db/Matcher.h and the associated wiki documentation for the
 * format.  This conversion is used to move back to the low-level
 * find() Cursor mechanism.
 *
 * @param builder the builder to write to
 **/
proto.toMatcherJson = function toMatcherJson(builder) {
	var q = this.matcher.query;
	for(var k in q){
		builder[k] = q[k];
	}
};

klass.uassertNoDisallowedClauses = function uassertNoDisallowedClauses(query) {
	for(var key in query){
		if(query.hasOwnProperty(key)){
			// can't use the Matcher API because this would segfault the constructor
			if (query[key] == "$where") throw new Error("code 16395; $where is not allowed inside of a $match aggregation expression");
			// geo breaks if it is not the first portion of the pipeline
			if (query[key] == "$near") throw new Error("code 16424; $near is not allowed inside of a $match aggregation expression");
			if (query[key] == "$within") throw new Error("code 16425; $within is not allowed inside of a $match aggregation expression");
			if (query[key] == "$nearSphere") throw new Error("code 16426; $nearSphere is not allowed inside of a $match aggregation expression");
			if (query[key] instanceof Object && query[key].constructor === Object) this.uassertNoDisallowedClauses(query[key]);
		}
	}
};

klass.createFromJson = function createFromJson(jsonElement, ctx) {
	if (!(jsonElement instanceof Object) || jsonElement.constructor !== Object) throw new Error("code 15959 ; the match filter must be an expression in an object");
	klass.uassertNoDisallowedClauses(jsonElement);
	var matcher = new MatchDocumentSource(jsonElement, ctx);
	return matcher;
};

},{"./FilterBaseDocumentSource":20,"sift":64}],24:[function(require,module,exports){
"use strict";

/**
 * A base class for filter document sources
 * @class ProjectDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [ctx] {ExpressionContext}
 **/
var ProjectDocumentSource = module.exports = function ProjectDocumentSource(ctx){
	if (arguments.length > 1) throw new Error("up to one arg expected");
	base.call(this, ctx);
	this.OE = new ObjectExpression();
	this._raw = undefined;
}, klass = ProjectDocumentSource, base = require('./DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Expression = require('../expressions/Expression');
var ObjectExpression = require('../expressions/ObjectExpression');
var Value = require('../Value');

klass.projectName = "$project";

/**
 * Returns the name of project
 * @return {string} the name of project
 **/
proto.getSourceName = function getSourceName() {
	return klass.projectName;
};

/**
 * Returns the object that was used to construct the ProjectDocumentSource
 * @return {object} the object that was used to construct the ProjectDocumentSource
 **/
proto.getRaw = function getRaw() {
	return this._raw;
};

/**
 * Calls base document source eof()
 * @return {bool} The result of base.source.eof()
 **/
proto.eof = function eof() {
	return this.source.eof();
};

/**
 * Calls base document source advance()
 * @return {bool} The result of base.source.advance()
 **/
proto.advance = function advance() {
	return this.source.advance();
};


/**
 * Builds a new document(object) that represents this base document
 * @return {object} A document that represents this base document
 **/
proto.getCurrent = function getCurrent() {
	var inDocument = this.source.getCurrent();
	if (!inDocument) throw new Error('inDocument must be an object');
	var resultDocument = {};
	this.OE.addToDocument(resultDocument, inDocument, /*root=*/inDocument);
	return resultDocument;
};

/**
 * Optimizes the internal ObjectExpression
 * @return
 **/
proto.optimize = function optimize() {
	this.OE.optimize();
};

proto.toJSON = function toJSON(){
	var obj = {};
	this.sourceToJson(obj);
	return obj;
};

/**
 * Places a $project key inside the builder object with value of this.OE
 * @method sourceToJson
 * @param {builder} An object (was ported from BsonBuilder)
 * @return
 **/
proto.sourceToJson = function sourceToJson(builder, explain) {
	var insides = this.OE.toJSON(true);
	builder[this.getSourceName()] = insides;
};

/**
 * Builds a new ProjectDocumentSource from an object
 * @method createFromJson
 * @return {ProjectDocmentSource} a ProjectDocumentSource instance
 **/
klass.createFromJson = function(jsonElement, expCtx) {
	if (!(jsonElement instanceof Object) || jsonElement.constructor !== Object) throw new Error('Error 15969. Specification must be an object but was ' + typeof jsonElement);
	var objectContext = new Expression.ObjectCtx({
		isDocumentOk: true,
		isTopLevel: true,
		isInclusionOk: true
	});
	var project = new ProjectDocumentSource(expCtx);
	project._raw = jsonElement;
	var parsed = Expression.parseObject(jsonElement, objectContext);
	var exprObj = parsed;
	if (!exprObj instanceof ObjectExpression) throw new Error("16402, parseObject() returned wrong type of Expression");
	if (!exprObj.getFieldCount()) throw new Error("16403, $projection requires at least one output field");
	project.OE = exprObj;
	return project;
};

/**
 *	Adds dependencies to the contained ObjectExpression
 *	@param {deps} An object that is treated as a set of strings
 *	@return A string that is part of the GetDepsReturn enum
 **/
proto.getDependencies = function getDependencies(deps) {
	var path = [];
	this.OE.addDependencies(deps, path);
	return base.GetDepsReturn.EXHAUSTIVE;
};

},{"../Value":7,"../expressions/Expression":40,"../expressions/ObjectExpression":51,"./DocumentSource":19}],25:[function(require,module,exports){
"use strict";

/**
 * A document source skipper
 * @class SkipDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [ctx] {ExpressionContext}
 **/
var SkipDocumentSource = module.exports = function SkipDocumentSource(ctx){
	if (arguments.length > 1) throw new Error("up to one arg expected");
	base.call(this, ctx);
	this.skip = 0;
	this.count = 0;
}, klass = SkipDocumentSource, base = require('./DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.skipName = "$skip";
proto.getSourceName = function getSourceName(){
	return klass.skipName;
};

/**
 * Coalesce skips together
 * @param {Object} nextSource the next source
 * @return {bool} return whether we can coalese together
 **/
proto.coalesce = function coalesce(nextSource) {
	var nextSkip =	nextSource.constructor === SkipDocumentSource?nextSource:null;

	// if it's not another $skip, we can't coalesce
	if (!nextSkip) return false;

	// we need to skip over the sum of the two consecutive $skips
	this.skip += nextSkip.skip;
	return true;
};

proto.skipper = function skipper() {
	if (this.count === 0) {
		while (!this.source.eof() && this.count++ < this.skip) {
			this.source.advance();
		}
	}

	if (this.source.eof()) {
		this.current = null;
		return;
	}

	this.current = this.source.getCurrent();
};


/**
 * Is the source at EOF?
 * @method	eof
 **/
proto.eof = function eof() {
	this.skipper();
	return this.source.eof();
};

/**
 * some implementations do the equivalent of verify(!eof()) so check eof() first
 * @method	getCurrent
 * @returns	{Document}	the current Document without advancing
 **/
proto.getCurrent = function getCurrent() {
	this.skipper();
	return this.source.getCurrent();
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
	if (this.eof()) {
		this.current = null;
		return false;
	}

	this.current = this.source.getCurrent();
	return this.source.advance();
};

/**
 * Create an object that represents the document source.  The object
 * will have a single field whose name is the source's name.  This
 * will be used by the default implementation of addToJsonArray()
 * to add this object to a pipeline being represented in JSON.
 *
 * @method	sourceToJson
 * @param	{Object} builder	JSONObjBuilder: a blank object builder to write to
 * @param	{Boolean}	explain	create explain output
 **/
proto.sourceToJson = function sourceToJson(builder, explain) {
	builder.$skip = this.skip;
};

/**
 * Creates a new SkipDocumentSource with the input number as the skip
 *
 * @param {Number} JsonElement this thing is *called* Json, but it expects a number
 **/
klass.createFromJson = function createFromJson(jsonElement, ctx) {
	if (typeof jsonElement !== "number") throw new Error("code 15972; the value to skip must be a number");

	var nextSkip = new SkipDocumentSource(ctx);

	nextSkip.skip = jsonElement;
	if (nextSkip.skip < 0 || isNaN(nextSkip.skip)) throw new Error("code 15956; the number to skip cannot be negative");

	return nextSkip;
};

},{"./DocumentSource":19}],26:[function(require,module,exports){
"use strict";

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
	this.current = null;
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

proto.getDependencies = function getDependencies(deps) {
	for(var i = 0; i < this.vSortKey.length; ++i) {
		this.vSortKey[i].addDependencies(deps);
	}
	return klass.GetDepsReturn.SEE_NEXT;
};

/**
 * Is the source at EOF?
 * @method	eof
 * @return {bool} return if we have hit the end of input
 **/
proto.eof = function eof() {
	if (!this.populated) this.populate();
	return (this.docIterator == this.documents.length);
};

/**
 * some implementations do the equivalent of verify(!eof()) so check eof() first
 * @method	getCurrent
 * @returns	{Document}	the current Document without advancing
 **/
proto.getCurrent = function getCurrent() {
	if (!this.populated) this.populate();
	return this.current;
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

	if (!this.populated) this.populate();

	if (this.docIterator == this.documents.length) throw new Error("This should never happen");
	++this.docIterator;

	if (this.docIterator == this.documents.length) {
		this.current = null;
		return false;
	}
	this.current = this.documents[this.docIterator];
	return true;
};

/**
 * Create an object that represents the document source.  The object
 * will have a single field whose name is the source's name.  This
 * will be used by the default implementation of addToJsonArray()
 * to add this object to a pipeline being represented in JSON.
 *
 * @method	sourceToJson
 * @param	{Object} builder	JSONObjBuilder: a blank object builder to write to
 * @param	{Boolean}	explain	create explain output
**/
proto.sourceToJson = function sourceToJson(builder, explain) {
	var insides = {};
	this.sortKeyToJson(insides, false);
	builder[this.getSourceName()] = insides;
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
		throw new Error("ascending must be true or false");
	}
};

proto.populate = function populate() {
	/* make sure we've got a sort key */
	if (this.vSortKey.length === null) throw new Error("This should never happen");

	/* pull everything from the underlying source */
	for(var hasNext = !this.source.eof(); hasNext; hasNext = this.source.advance()) {
		var doc = this.source.getCurrent();
		this.documents.push(doc);
	}

	this.vSortKeyFPEs = this.vSortKey.map(function(aSortKey){
		return new FieldPathExpression(aSortKey.getFieldPath(false));
	});

	/* sort the list */
	this.documents.sort(SortDocumentSource.prototype.compare.bind(this));

	/* start the sort iterator */
	this.docIterator = 0;

	if (this.docIterator < this.documents.length) {
		this.current = this.documents[this.docIterator];
	}
	this.populated = true;
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
		var pathExpr = this.vSortKeyFPEs[i];
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
*
* @param {Object} builder initialized object builder.
* @param {bool} fieldPrefix specify whether or not to include the field
**/
proto.sortKeyToJson = function sortKeyToJson(builder, usePrefix) {
	// add the key fields
	var n = this.vSortKey.length;
	for(var i = 0; i < n; ++i) {
		// create the "field name"
		var ss = this.vSortKey[i].getFieldPath(usePrefix); // renamed write to get
		// push a named integer based on the sort order
		builder[ss] = this.vAscending[i] > 0 ? 1 : -1;
	}
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

},{"../Value":7,"../expressions/FieldPathExpression":41,"./DocumentSource":19}],27:[function(require,module,exports){
"use strict";

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
 * Lazily construct the _unwinder and initialize the iterator state of this DocumentSource.
 * To be called by all members that depend on the iterator state.
 **/
proto.lazyInit = function lazyInit(){
	if (!this._unwinder) {
		if (!this._unwindPath){
			throw new Error("unwind path does not exist!");
		}
		this._unwinder = new klass.Unwinder(this._unwindPath);
		if (!this.source.eof()) {
			// Set up the first source document for unwinding.
			this._unwinder.resetDocument(this.source.getCurrent());
		}
		this.mayAdvanceSource();
	}
};

/**
 * If the _unwinder is exhausted and the source may be advanced, advance the source and
 * reset the _unwinder's source document.
 **/
proto.mayAdvanceSource = function mayAdvanceSource(){
	while(this._unwinder.eof()) {
		// The _unwinder is exhausted.

		if (this.source.eof()) return; // The source is exhausted.
		if (!this.source.advance()) return; // The source is exhausted.

		// Reset the _unwinder with source's next document.
		this._unwinder.resetDocument(this.source.getCurrent());
	}
};

/**
 * Specify the field to unwind.
**/
proto.unwindPath = function unwindPath(fieldPath){
	// Can't set more than one unwind path.
	if (this._unwindPath) throw new Error(this.getSourceName() + " can't unwind more than one path; code 15979");

	// Record the unwind path.
	this._unwindPath = new FieldPath(fieldPath);
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


/**
 * Is the source at EOF?
 * @method	eof
**/
proto.eof = function eof() {
	this.lazyInit();
	return this._unwinder.eof();
};

/**
 * some implementations do the equivalent of verify(!eof()) so check eof() first
 * @method	getCurrent
 * @returns	{Document}	the current Document without advancing
**/
proto.getCurrent = function getCurrent() {
	this.lazyInit();
	return this._unwinder.getCurrent();
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
	this.lazyInit();
	this._unwinder.advance();
	this.mayAdvanceSource();
	return !this._unwinder.eof();
};

/**
 * Create an object that represents the document source.  The object
 * will have a single field whose name is the source's name.  This
 * will be used by the default implementation of addToJsonArray()
 * to add this object to a pipeline being represented in JSON.
 *
 * @method	sourceToJson
 * @param	{Object} builder	JSONObjBuilder: a blank object builder to write to
 * @param	{Boolean}	explain	create explain output
**/
proto.sourceToJson = function sourceToJson(builder, explain) {
	if (!this._unwindPath) throw new Error("unwind path does not exist!");
	builder[this.getSourceName()] = this._unwindPath.getPath(true);
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

},{"../Document":3,"../FieldPath":4,"../expressions/Expression":40,"./DocumentSource":19}],28:[function(require,module,exports){
"use strict";
module.exports = {
	CursorDocumentSource: require("./CursorDocumentSource.js"),
	DocumentSource: require("./DocumentSource.js"),
	FilterBaseDocumentSource: require("./FilterBaseDocumentSource.js"),
	GroupDocumentSource: require("./GroupDocumentSource.js"),
	LimitDocumentSource: require("./LimitDocumentSource.js"),
	MatchDocumentSource: require("./MatchDocumentSource.js"),
	ProjectDocumentSource: require("./ProjectDocumentSource.js"),
	SkipDocumentSource: require("./SkipDocumentSource.js"),
	SortDocumentSource: require("./SortDocumentSource.js"),
	UnwindDocumentSource: require("./UnwindDocumentSource.js")
};

},{"./CursorDocumentSource.js":18,"./DocumentSource.js":19,"./FilterBaseDocumentSource.js":20,"./GroupDocumentSource.js":21,"./LimitDocumentSource.js":22,"./MatchDocumentSource.js":23,"./ProjectDocumentSource.js":24,"./SkipDocumentSource.js":25,"./SortDocumentSource.js":26,"./UnwindDocumentSource.js":27}],29:[function(require,module,exports){
"use strict";

/** 
 * Create an expression that finds the sum of n operands. 
 * @class AddExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var AddExpression = module.exports = function AddExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = AddExpression, NaryExpression = require("./NaryExpression"), base = NaryExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$add";
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

/**
 * Takes an array of one or more numbers and adds them together, returning the sum.
 * @method @evaluate
 **/
proto.evaluate = function evaluate(doc) {
	var total = 0;
	for (var i = 0, n = this.operands.length; i < n; ++i) {
		var value = this.operands[i].evaluate(doc);
		if (value instanceof Date) throw new Error("$add does not support dates; code 16415");
		if (typeof value == "string") throw new Error("$add does not support strings; code 16416");
		total += Value.coerceToDouble(value);
	}
	if (typeof total != "number") throw new Error("$add resulted in a non-numeric type; code 16417");
	return total;
};

},{"../Value":7,"./NaryExpression":49}],30:[function(require,module,exports){
"use strict";

/** 
 * Create an expression that finds the conjunction of n operands. The
 * conjunction uses short-circuit logic; the expressions are evaluated in the
 * order they were added to the conjunction, and the evaluation stops and
 * returns false on the first operand that evaluates to false.
 *
 * @class AndExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var AndExpression = module.exports = function AndExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = AndExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	ConstantExpression = require("./ConstantExpression"),
	CoerceToBoolExpression = require("./CoerceToBoolExpression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$and";
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

/**
 * Takes an array one or more values and returns true if all of the values in the array are true. Otherwise $and returns false.
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc) {
	for (var i = 0, n = this.operands.length; i < n; ++i) {
		var value = this.operands[i].evaluate(doc);
		if (!Value.coerceToBool(value)) return false;
	}
	return true;
};

proto.optimize = function optimize() {
	var expr = base.prototype.optimize.call(this); //optimize the conjunction as much as possible

	// if the result isn't a conjunction, we can't do anything
	if (!(expr instanceof AndExpression)) return expr;
	var andExpr = expr;

	// Check the last argument on the result; if it's not constant (as promised by ExpressionNary::optimize(),) then there's nothing we can do.
	var n = andExpr.operands.length;
	// ExpressionNary::optimize() generates an ExpressionConstant for {$and:[]}.
	if (!n) throw new Error("requires operands!");
	var lastExpr = andExpr.operands[n - 1];
	if (!(lastExpr instanceof ConstantExpression)) return expr;

	// Evaluate and coerce the last argument to a boolean.  If it's false, then we can replace this entire expression.
	var last = Value.coerceToBool(lastExpr.evaluate());
	if (!last) return new ConstantExpression(false);

	// If we got here, the final operand was true, so we don't need it anymore.
	// If there was only one other operand, we don't need the conjunction either.
	// Note we still need to keep the promise that the result will be a boolean.
	if (n == 2) return new CoerceToBoolExpression(andExpr.operands[0]);

	//Remove the final "true" value, and return the new expression.
	//CW TODO: Note that because of any implicit conversions, we may need to apply an implicit boolean conversion.
	andExpr.operands.length = n - 1; //truncate the array
	return expr;
};

//TODO:	proto.toMatcherBson

},{"../Value":7,"./CoerceToBoolExpression":31,"./ConstantExpression":35,"./NaryExpression":49}],31:[function(require,module,exports){
"use strict";

/** 
 * internal expression for coercing things to booleans 
 * @class CoerceToBoolExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var CoerceToBoolExpression = module.exports = function CoerceToBoolExpression(expression){
	if (arguments.length !== 1) throw new Error("args expected: expression");
	this.expression = expression;
	base.call(this);
}, klass = CoerceToBoolExpression, base = require("./Expression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	AndExpression = require("./AndExpression"),
	OrExpression = require("./OrExpression"),
	NotExpression = require("./NotExpression");

// PROTOTYPE MEMBERS
proto.evaluate = function evaluate(doc){
	var result = this.expression.evaluate(doc);
	return Value.coerceToBool(result);
};

proto.optimize = function optimize() {
	this.expression = this.expression.optimize();	// optimize the operand

	// if the operand already produces a boolean, then we don't need this
	// LATER - Expression to support a "typeof" query?
	var expr = this.expression;
	if(expr instanceof AndExpression ||
			expr instanceof OrExpression ||
			expr instanceof NotExpression ||
			expr instanceof CoerceToBoolExpression)
		return expr;
	return this;
};

proto.addDependencies = function addDependencies(deps, path) {
	return this.expression.addDependencies(deps);
};

proto.toJSON = function toJSON() {
	// Serializing as an $and expression which will become a CoerceToBool
	return {$and:[this.expression.toJSON()]};
};

//TODO:	proto.addToBsonObj   --- may be required for $project to work
//TODO:	proto.addToBsonArray

},{"../Value":7,"./AndExpression":30,"./Expression":40,"./NotExpression":50,"./OrExpression":52}],32:[function(require,module,exports){
"use strict";

/**
 * Generic comparison expression that gets used for $eq, $ne, $lt, $lte, $gt, $gte, and $cmp. 
 * @class CompareExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var CompareExpression = module.exports = function CompareExpression(cmpOp) {
	if (arguments.length !== 1) throw new Error("args expected: cmpOp");
	this.cmpOp = cmpOp;
	base.call(this);
}, klass = CompareExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	Expression = require("./Expression"),
	ConstantExpression = require("./ConstantExpression"),
	FieldPathExpression = require("./FieldPathExpression"),
	FieldRangeExpression = require("./FieldRangeExpression");

// NESTED CLASSES
/**
 * Lookup table for truth value returns
 *
 * @param truthValues	truth value for -1, 0, 1
 * @param reverse		reverse comparison operator
 * @param name			string name
 **/
var CmpLookup = (function(){	// emulating a struct
	// CONSTRUCTOR
	var klass = function CmpLookup(truthValues, reverse, name) {
		if(arguments.length !== 3) throw new Error("args expected: truthValues, reverse, name");
		this.truthValues = truthValues;
		this.reverse = reverse;
		this.name = name;
	}, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});
	return klass;
})();

// PRIVATE STATIC MEMBERS
/**
 * a table of cmp type lookups to truth values
 * @private
 **/
var cmpLookupMap = [	//NOTE: converted from this Array to a Dict/Object below using CmpLookup#name as the key
	//              -1      0      1      reverse             name     (taking advantage of the fact that our 'enums' are strings below)
	new CmpLookup([false, true, false], Expression.CmpOp.EQ, Expression.CmpOp.EQ),
	new CmpLookup([true, false, true], Expression.CmpOp.NE, Expression.CmpOp.NE),
	new CmpLookup([false, false, true], Expression.CmpOp.LT, Expression.CmpOp.GT),
	new CmpLookup([false, true, true], Expression.CmpOp.LTE, Expression.CmpOp.GTE),
	new CmpLookup([true, false, false], Expression.CmpOp.GT, Expression.CmpOp.LT),
	new CmpLookup([true, true, false], Expression.CmpOp.GTE, Expression.CmpOp.LTE),
	new CmpLookup([false, false, false], Expression.CmpOp.CMP, Expression.CmpOp.CMP)
].reduce(function(r,o){r[o.name]=o;return r;},{});


// PROTOTYPE MEMBERS
proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(2);
	base.prototype.addOperand.call(this, expr);
};

proto.evaluate = function evaluate(doc) {
	this.checkArgCount(2);
	var left = this.operands[0].evaluate(doc),
		right = this.operands[1].evaluate(doc),
		cmp = Expression.signum(Value.compare(left, right));
	if (this.cmpOp == Expression.CmpOp.CMP) return cmp;
	return cmpLookupMap[this.cmpOp].truthValues[cmp + 1] || false;
};

proto.optimize = function optimize(){
	var expr = base.prototype.optimize.call(this); // first optimize the comparison operands
	if (!(expr instanceof CompareExpression)) return expr; // if no longer a comparison, there's nothing more we can do.

	// check to see if optimizing comparison operator is supported	// CMP and NE cannot use ExpressionFieldRange which is what this optimization uses
	var newOp = this.cmpOp;
	if (newOp == Expression.CmpOp.CMP || newOp == Expression.CmpOp.NE) return expr;

	// There's one localized optimization we recognize:  a comparison between a field and a constant.  If we recognize that pattern, replace it with an ExpressionFieldRange.
	// When looking for this pattern, note that the operands could appear in any order.  If we need to reverse the sense of the comparison to put it into the required canonical form, do so.
	var leftExpr = this.operands[0],
		rightExpr = this.operands[1];
	var fieldPathExpr, constantExpr;
	if (leftExpr instanceof FieldPathExpression) {
		fieldPathExpr = leftExpr;
		if (!(rightExpr instanceof ConstantExpression)) return expr; // there's nothing more we can do
		constantExpr = rightExpr;
	} else {
		// if the first operand wasn't a path, see if it's a constant
		if (!(leftExpr instanceof ConstantExpression)) return expr; // there's nothing more we can do
		constantExpr = leftExpr;

		// the left operand was a constant; see if the right is a path
		if (!(rightExpr instanceof FieldPathExpression)) return expr; // there's nothing more we can do
		fieldPathExpr = rightExpr;

		// these were not in canonical order, so reverse the sense
		newOp = cmpLookupMap[newOp].reverse;
	}
	return new FieldRangeExpression(fieldPathExpr, newOp, constantExpr.getValue());
};

proto.getOpName = function getOpName(){
	return this.cmpOp;
};

},{"../Value":7,"./ConstantExpression":35,"./Expression":40,"./FieldPathExpression":41,"./FieldRangeExpression":42,"./NaryExpression":49}],33:[function(require,module,exports){
"use strict";

/** 
 * Creates an expression that concatenates a set of string operands.
 * @class ConcatExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var ConcatExpression = module.exports = function ConcatExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = ConcatExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$concat";
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

/**
 * Concats a string of values together.
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc) {
	var result = "";
	for (var i = 0, n = this.operands.length; i < n; ++i) {
		var val = this.operands[i].evaluate(doc);
		if (val === null) return null; // if any operand is null, return null for all
		if (typeof(val) != "string") throw new Error("$concat only supports strings, not " + typeof(val) + "; code 16702");
		result = result + Value.coerceToString(val);
	}
	return result;
};

},{"../Value":7,"./NaryExpression":49}],34:[function(require,module,exports){
"use strict";

/**
 * $cond expression;  @see evaluate 
 * @class AndExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var CondExpression = module.exports = function CondExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = CondExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$cond";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(3);
	base.prototype.addOperand.call(this, expr);
};

/** 
 * Use the $cond operator with the following syntax:  { $cond: [ <boolean-expression>, <true-case>, <false-case> ] } 
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(3);
	var pCond = this.operands[0].evaluate(doc),
		idx = Value.coerceToBool(pCond) ? 1 : 2;
	return this.operands[idx].evaluate(doc);
};

},{"../Value":7,"./NaryExpression":49}],35:[function(require,module,exports){
"use strict";

/** 
 * Internal expression for constant values 
 * @class ConstantExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var ConstantExpression = module.exports = function ConstantExpression(value){
	if (arguments.length !== 1) throw new Error("args expected: value");
	this.value = value;	//TODO: actually make read-only in terms of JS?
	base.call(this);
}, klass = ConstantExpression, base = require("./Expression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$const";
};

/**
 * Get the constant value represented by this Expression.
 * @method getValue
 * @returns the value
 **/
proto.getValue = function getValue(){	//TODO: convert this to an instance field rather than a property
	return this.value;
};

proto.addDependencies = function addDependencies(deps, path) {
	// nothing to do
};

/**
 * Get the constant value represented by this Expression.
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	return this.value;
};

proto.optimize = function optimize() {
	return this; // nothing to do
};

proto.toJSON = function(isExpressionRequired){
	return isExpressionRequired ? {$const: this.value} : this.value;
};

//TODO:	proto.addToBsonObj   --- may be required for $project to work -- my hope is that we can implement toJSON methods all around and use that instead
//TODO:	proto.addToBsonArray

},{"./Expression":40}],36:[function(require,module,exports){
"use strict";

/**
 * Get the DayOfMonth from a date.
 * @class DayOfMonthExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var DayOfMonthExpression = module.exports = function DayOfMonthExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = DayOfMonthExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$dayOfMonth";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(1);
	base.prototype.addOperand.call(this, expr);
};

/**
 * Takes a date and returns the day of the month as a number between 1 and 31.
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(1);
	var date = this.operands[0].evaluate(doc);
	return date.getUTCDate();
};

},{"./NaryExpression":49}],37:[function(require,module,exports){
"use strict";

/**
 * Get the DayOfWeek from a date.
 * @class DayOfWeekExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var DayOfWeekExpression = module.exports = function DayOfWeekExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = DayOfWeekExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$dayOfWeek";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(1);
	base.prototype.addOperand.call(this, expr);
};

/**
 * Takes a date and returns the day of the week as a number between 1 (Sunday) and 7 (Saturday.)
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(1);
	var date = this.operands[0].evaluate(doc);
	return date.getUTCDay()+1;
};

},{"./NaryExpression":49}],38:[function(require,module,exports){
"use strict";

/**
 * Get the DayOfYear from a date.
 * @class DayOfYearExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var DayOfYearExpression = module.exports = function DayOfYearExpression(){
	if(arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = DayOfYearExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$dayOfYear";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(1);
	base.prototype.addOperand.call(this, expr);
};

/**
 * Takes a date and returns the day of the year as a number between 1 and 366.
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	//NOTE: the below silliness is to deal with the leap year scenario when we should be returning 366
	this.checkArgCount(1);
	var date = this.operands[0].evaluate(doc);
	return klass.getDateDayOfYear(date);
};

// STATIC METHODS
klass.getDateDayOfYear = function getDateDayOfYear(d){
	var y11 = new Date(d.getUTCFullYear(), 0, 1),	// same year, first month, first day; time omitted
		ymd = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()+1);	// same y,m,d; time omitted, add 1 because days start at 1
	return Math.ceil((ymd - y11) / 86400000);	//NOTE: 86400000 ms is 1 day
};

},{"./NaryExpression":49}],39:[function(require,module,exports){
"use strict";

/** 
 * A $divide pipeline expression. 
 * @see evaluate 
 * @class DivideExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var DivideExpression = module.exports = function DivideExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = DivideExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){	//TODO: try to move this to a static and/or instance field instead of a getter function
	return "$divide";
};

proto.addOperand = function addOperand(expr){
	this.checkArgLimit(2);
	base.prototype.addOperand.call(this, expr);
};

/**
 * Takes an array that contains a pair of numbers and returns the value of the first number divided by the second number.
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc) {
	this.checkArgCount(2);
	var left = this.operands[0].evaluate(doc),
		right = this.operands[1].evaluate(doc);
	if (!(left instanceof Date) && (!right instanceof Date)) throw new Error("$divide does not support dates; code 16373");
	right = Value.coerceToDouble(right);
	if (right === 0) return undefined;
	left = Value.coerceToDouble(left);
	return left / right;
};

},{"../Value":7,"./NaryExpression":49}],40:[function(require,module,exports){
"use strict";

/**
 * A base class for all pipeline expressions; Performs common expressions within an Op.
 *
 * NOTE: An object expression can take any of the following forms:
 *
 *	f0: {f1: ..., f2: ..., f3: ...}
 *	f0: {$operator:[operand1, operand2, ...]}
 *
 * @class Expression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var Expression = module.exports = function Expression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
}, klass = Expression, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Document = require("../Document");

// NESTED CLASSES
/**
 * Reference to the `mungedb-aggregate.pipeline.expressions.Expression.ObjectCtx` class
 * @static
 * @property ObjectCtx
 **/
var ObjectCtx = Expression.ObjectCtx = (function(){
	// CONSTRUCTOR
	/**
	 * Utility class for parseObject() below. isDocumentOk indicates that it is OK to use a Document in the current context.
	 *
	 * NOTE: deviation from Mongo code: accepts an `Object` of settings rather than a bitmask to help simplify the interface a little bit
	 *
	 * @class ObjectCtx
	 * @namespace mungedb-aggregate.pipeline.expressions.Expression
	 * @module mungedb-aggregate
	 * @constructor
	 * @param opts
	 *	@param [opts.isDocumentOk]	{Boolean}
	 *	@param [opts.isTopLevel]	{Boolean}
	 *	@param [opts.isInclusionOk]	{Boolean}
	 **/
	var klass = function ObjectCtx(opts /*= {isDocumentOk:..., isTopLevel:..., isInclusionOk:...}*/){
		if(!(opts instanceof Object && opts.constructor == Object)) throw new Error("opts is required and must be an Object containing named args");
		for (var k in opts) { // assign all given opts to self so long as they were part of klass.prototype as undefined properties
			if (opts.hasOwnProperty(k) && proto.hasOwnProperty(k) && proto[k] === undefined) this[k] = opts[k];
		}
	}, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

	// PROTOTYPE MEMBERS
	proto.isDocumentOk =
	proto.isTopLevel =
	proto.isInclusionOk = undefined;

	return klass;
})();

/**
 * Reference to the `mungedb-aggregate.pipeline.expressions.Expression.OpDesc` class
 * @static
 * @property OpDesc
 **/
var OpDesc = Expression.OpDesc = (function(){
	// CONSTRUCTOR
	/**
	 * Decribes how and when to create an Op instance
	 *
	 * @class OpDesc
	 * @namespace mungedb-aggregate.pipeline.expressions.Expression
	 * @module mungedb-aggregate
	 * @constructor
	 * @param name
	 * @param factory
	 * @param flags
	 * @param argCount
	 **/
	var klass = function OpDesc(name, factory, flags, argCount){
		var firstArg = arguments[0];
		if (firstArg instanceof Object && firstArg.constructor == Object) { //TODO: using this?
			var opts = firstArg;
			for (var k in opts) { // assign all given opts to self so long as they were part of klass.prototype as undefined properties
				if (opts.hasOwnProperty(k) && proto.hasOwnProperty(k) && proto[k] === undefined) this[k] = opts[k];
			}
		} else {
			this.name = name;
			this.factory = factory;
			this.flags = flags || 0;
			this.argCount = argCount || 0;
		}
	}, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

	// STATIC MEMBERS
	klass.FIXED_COUNT = 1;
	klass.OBJECT_ARG = 2;

	// PROTOTYPE MEMBERS
	proto.name =
	proto.factory =
	proto.flags =
	proto.argCount = undefined;

	/**
	 * internal `OpDesc#name` comparer
	 * @method cmp
	 * @param that the other `OpDesc` instance
	 **/
	proto.cmp = function cmp(that) {
		return this.name < that.name ? -1 : this.name > that.name ? 1 : 0;
	};

	return klass;
})();
// END OF NESTED CLASSES
/**
 * @class Expression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 **/

var kinds = {
	UNKNOWN: "UNKNOWN",
	OPERATOR: "OPERATOR",
	NOT_OPERATOR: "NOT_OPERATOR"
};


// STATIC MEMBERS
/**
 * Enumeration of comparison operators.  These are shared between a few expression implementations, so they are factored out here.
 *
 * @static
 * @property CmpOp
 **/
klass.CmpOp = {
	EQ: "$eq",		// return true for a == b, false otherwise
	NE: "$ne",		// return true for a != b, false otherwise
	GT: "$gt",		// return true for a > b, false otherwise
	GTE: "$gte",	// return true for a >= b, false otherwise
	LT: "$lt",		// return true for a < b, false otherwise
	LTE: "$lte",	// return true for a <= b, false otherwise
	CMP: "$cmp"		// return -1, 0, 1 for a < b, a == b, a > b
};

// DEPENDENCIES (later in this file as compared to others to ensure that the required statics are setup first)
var FieldPathExpression = require("./FieldPathExpression"),
	ObjectExpression = require("./ObjectExpression"),
	ConstantExpression = require("./ConstantExpression"),
	CompareExpression = require("./CompareExpression");

// DEFERRED DEPENDENCIES
/**
 * Expressions, as exposed to users
 *
 * @static
 * @property opMap
 **/
setTimeout(function(){ // Even though `opMap` is deferred, force it to load early rather than later to prevent even *more* potential silliness
	Object.defineProperty(klass, "opMap", {value:klass.opMap});
}, 0);
Object.defineProperty(klass, "opMap", {	//NOTE: deferred requires using a getter to allow circular requires (to maintain the ported API)
	configurable: true,
	get: function getOpMapOnce() {
		return Object.defineProperty(klass, "opMap", {
			value: [	//NOTE: rather than OpTable because it gets converted to a dict via OpDesc#name in the Array#reduce() below
				new OpDesc("$add", require("./AddExpression"), 0),
				new OpDesc("$and", require("./AndExpression"), 0),
				new OpDesc("$cmp", CompareExpression.bind(null, Expression.CmpOp.CMP), OpDesc.FIXED_COUNT, 2),
				new OpDesc("$concat", require("./ConcatExpression"), 0),
				new OpDesc("$cond", require("./CondExpression"), OpDesc.FIXED_COUNT, 3),
		//		$const handled specially in parseExpression
				new OpDesc("$dayOfMonth", require("./DayOfMonthExpression"), OpDesc.FIXED_COUNT, 1),
				new OpDesc("$dayOfWeek", require("./DayOfWeekExpression"), OpDesc.FIXED_COUNT, 1),
				new OpDesc("$dayOfYear", require("./DayOfYearExpression"), OpDesc.FIXED_COUNT, 1),
				new OpDesc("$divide", require("./DivideExpression"), OpDesc.FIXED_COUNT, 2),
				new OpDesc("$eq", CompareExpression.bind(null, Expression.CmpOp.EQ), OpDesc.FIXED_COUNT, 2),
				new OpDesc("$gt", CompareExpression.bind(null, Expression.CmpOp.GT), OpDesc.FIXED_COUNT, 2),
				new OpDesc("$gte", CompareExpression.bind(null, Expression.CmpOp.GTE), OpDesc.FIXED_COUNT, 2),
				new OpDesc("$hour", require("./HourExpression"), OpDesc.FIXED_COUNT, 1),
				new OpDesc("$ifNull", require("./IfNullExpression"), OpDesc.FIXED_COUNT, 2),
				new OpDesc("$lt", CompareExpression.bind(null, Expression.CmpOp.LT), OpDesc.FIXED_COUNT, 2),
				new OpDesc("$lte", CompareExpression.bind(null, Expression.CmpOp.LTE), OpDesc.FIXED_COUNT, 2),
				new OpDesc("$minute", require("./MinuteExpression"), OpDesc.FIXED_COUNT, 1),
				new OpDesc("$mod", require("./ModExpression"), OpDesc.FIXED_COUNT, 2),
				new OpDesc("$month", require("./MonthExpression"), OpDesc.FIXED_COUNT, 1),
				new OpDesc("$multiply", require("./MultiplyExpression"), 0),
				new OpDesc("$ne", CompareExpression.bind(null, Expression.CmpOp.NE), OpDesc.FIXED_COUNT, 2),
				new OpDesc("$not", require("./NotExpression"), OpDesc.FIXED_COUNT, 1),
				new OpDesc("$or", require("./OrExpression"), 0),
				new OpDesc("$second", require("./SecondExpression"), OpDesc.FIXED_COUNT, 1),
				new OpDesc("$strcasecmp", require("./StrcasecmpExpression"), OpDesc.FIXED_COUNT, 2),
				new OpDesc("$substr", require("./SubstrExpression"), OpDesc.FIXED_COUNT, 3),
				new OpDesc("$subtract", require("./SubtractExpression"), OpDesc.FIXED_COUNT, 2),
				new OpDesc("$toLower", require("./ToLowerExpression"), OpDesc.FIXED_COUNT, 1),
				new OpDesc("$toUpper", require("./ToUpperExpression"), OpDesc.FIXED_COUNT, 1),
				new OpDesc("$week", require("./WeekExpression"), OpDesc.FIXED_COUNT, 1),
				new OpDesc("$year", require("./YearExpression"), OpDesc.FIXED_COUNT, 1)
			].reduce(function(r,o){r[o.name]=o; return r;}, {})
		}).opMap;
	}
});

/**
 * Parse an Object.  The object could represent a functional expression or a Document expression.
 *
 * An object expression can take any of the following forms:
 *
 *	f0: {f1: ..., f2: ..., f3: ...}
 *	f0: {$operator:[operand1, operand2, ...]}
 *
 * @static
 * @method parseObject
 * @param obj	the element representing the object
 * @param ctx	a MiniCtx representing the options above
 * @returns the parsed Expression
 **/
klass.parseObject = function parseObject(obj, ctx){
	if(!(ctx instanceof ObjectCtx)) throw new Error("ctx must be ObjectCtx");
	var kind = kinds.UNKNOWN,
		expr, // the result
		exprObj; // the alt result
	if (obj === undefined) return new ObjectExpression();
	var fieldNames = Object.keys(obj);
	for (var fc = 0, n = fieldNames.length; fc < n; ++fc) {
		var fn = fieldNames[fc];
		if (fn[0] === "$") {
			if (fc !== 0) throw new Error("the operator must be the only field in a pipeline object (at '" + fn + "'.; code 16410");
			if(ctx.isTopLevel) throw new Error("$expressions are not allowed at the top-level of $project; code 16404");
			kind = kinds.OPERATOR;	//we've determined this "object" is an operator expression
			expr = Expression.parseExpression(fn, obj[fn]);
		} else {
			if (kind === kinds.OPERATOR) throw new Error("this object is already an operator expression, and can't be used as a document expression (at '" + fn + "'.; code 15990");
			if (!ctx.isTopLevel && fn.indexOf(".") != -1) throw new Error("dotted field names are only allowed at the top level; code 16405");
			if (expr === undefined) { // if it's our first time, create the document expression
				if (!ctx.isDocumentOk) throw new Error("document not allowed in this context"); // CW TODO error: document not allowed in this context
				expr = exprObj = new ObjectExpression();
				kind = kinds.NOT_OPERATOR;	//this "object" is not an operator expression
			}
			var fv = obj[fn];
			switch (typeof(fv)) {
			case "object":
				// it's a nested document
				var subCtx = new ObjectCtx({
					isDocumentOk: ctx.isDocumentOk,
					isInclusionOk: ctx.isInclusionOk
				});
				exprObj.addField(fn, Expression.parseObject(fv, subCtx));
				break;
			case "string":
				// it's a renamed field		// CW TODO could also be a constant
				var pathExpr = new FieldPathExpression(Expression.removeFieldPrefix(fv));
				exprObj.addField(fn, pathExpr);
				break;
			case "boolean":
			case "number":
				// it's an inclusion specification
				if (fv) {
					if (!ctx.isInclusionOk) throw new Error("field inclusion is not allowed inside of $expressions; code 16420");
					exprObj.includePath(fn);
				} else {
					if (!(ctx.isTopLevel && fn == Document.ID_PROPERTY_NAME)) throw new Error("The top-level " + Document.ID_PROPERTY_NAME + " field is the only field currently supported for exclusion; code 16406");
					exprObj.excludeId = true;
				}
				break;
			default:
				throw new Error("disallowed field type " + (fv ? fv.constructor.name + ":" : "") + typeof(fv) + " in object expression (at '" + fn + "')");
			}
		}
	}
	return expr;
};

/**
 * Parse a BSONElement Object which has already been determined to be functional expression.
 *
 * @static
 * @method parseExpression
 * @param opName	the name of the (prefix) operator
 * @param obj	the BSONElement to parse
 * @returns the parsed Expression
 **/
klass.parseExpression = function parseExpression(opName, obj) {
	// look for the specified operator
	if (opName === "$const") return new ConstantExpression(obj); //TODO: createFromBsonElement was here, not needed since this isn't BSON?
	var op = klass.opMap[opName];
	if (!(op instanceof OpDesc)) throw new Error("invalid operator " + opName + "; code 15999");

	// make the expression node
	var IExpression = op.factory,	//TODO: should this get renamed from `factory` to `ctor` or something?
		expr = new IExpression();

	// add the operands to the expression node
	if (op.flags & OpDesc.FIXED_COUNT && op.argCount > 1 && !(obj instanceof Array)) throw new Error("the " + op.name + " operator requires an array of " + op.argCount + " operands; code 16019");
	var operand; // used below
	if (obj.constructor === Object) { // the operator must be unary and accept an object argument
		if (!(op.flags & OpDesc.OBJECT_ARG)) throw new Error("the " + op.name + " operator does not accept an object as an operand");
		operand = Expression.parseObject(obj, new ObjectCtx({isDocumentOk: 1}));
		expr.addOperand(operand);
	} else if (obj instanceof Array) { // multiple operands - an n-ary operator
		if (op.flags & OpDesc.FIXED_COUNT && op.argCount !== obj.length) throw new Error("the " + op.name + " operator requires " + op.argCount + " operand(s); code 16020");
		for (var i = 0, n = obj.length; i < n; ++i) {
			operand = Expression.parseOperand(obj[i]);
			expr.addOperand(operand);
		}
	} else { //assume it's an atomic operand
		if (op.flags & OpDesc.FIXED_COUNT && op.argCount != 1) throw new Error("the " + op.name + " operator requires an array of " + op.argCount + " operands; code 16022");
		operand = Expression.parseOperand(obj);
		expr.addOperand(operand);
	}

	return expr;
};

/**
 * Parse a BSONElement which is an operand in an Expression.
 *
 * @static
 * @param pBsonElement the expected operand's BSONElement
 * @returns the parsed operand, as an Expression
 **/
klass.parseOperand = function parseOperand(obj){
	var t = typeof(obj);
	if (t === "string" && obj[0] == "$") { //if we got here, this is a field path expression
		var path = Expression.removeFieldPrefix(obj);
		return new FieldPathExpression(path);
	}
	else if (t === "object" && obj && obj.constructor === Object) return Expression.parseObject(obj, new ObjectCtx({isDocumentOk: true}));
	else return new ConstantExpression(obj);
};

/**
 * Produce a field path string with the field prefix removed.
 * Throws an error if the field prefix is not present.
 *
 * @static
 * @param prefixedField the prefixed field
 * @returns the field path with the prefix removed
 **/
klass.removeFieldPrefix = function removeFieldPrefix(prefixedField) {
	if (prefixedField.indexOf("\0") != -1) throw new Error("field path must not contain embedded null characters; code 16419");
	if (prefixedField[0] !== "$") throw new Error("field path references must be prefixed with a '$' ('" + prefixedField + "'); code 15982");
	return prefixedField.substr(1);
};

/**
 * returns the signe of a number
 *
 * @static
 * @method signum
 * @returns the sign of a number; -1, 1, or 0
 **/
klass.signum = function signum(i) {
	if (i < 0) return -1;
	if (i > 0) return 1;
	return 0;
};


// PROTOTYPE MEMBERS
/**
 * Evaluate the Expression using the given document as input.
 *
 * @method evaluate
 * @returns the computed value
 **/
proto.evaluate = function evaluate(obj) {
	throw new Error("WAS NOT IMPLEMENTED BY INHERITOR!");
};

/**
 * Optimize the Expression.
 *
 * This provides an opportunity to do constant folding, or to collapse nested
 *  operators that have the same precedence, such as $add, $and, or $or.
 *
 * The Expression should be replaced with the return value, which may or may
 *  not be the same object.  In the case of constant folding, a computed
 *  expression may be replaced by a constant.
 *
 * @method optimize
 * @returns the optimized Expression
 **/
proto.optimize = function optimize() {
	throw new Error("WAS NOT IMPLEMENTED BY INHERITOR!");
};

/**
 * Add this expression's field dependencies to the set Expressions are trees, so this is often recursive.
 *
 * Top-level ExpressionObject gets pointer to empty vector.
 * If any other Expression is an ancestor, or in other cases where {a:1} inclusion objects aren't allowed, they get NULL.
 *
 * @method addDependencies
 * @param deps	output parameter
 * @param path	path to self if all ancestors are ExpressionObjects.
 **/
proto.addDependencies = function addDependencies(deps, path) {
	throw new Error("WAS NOT IMPLEMENTED BY INHERITOR!");
};

/**
 * simple expressions are just inclusion exclusion as supported by ExpressionObject
 * @method getIsSimple
 **/
proto.getIsSimple = function getIsSimple() {
	return false;
};

proto.toMatcherBson = function toMatcherBson(){
	throw new Error("WAS NOT IMPLEMENTED BY INHERITOR!");	//verify(false && "Expression::toMatcherBson()");
};

},{"../Document":3,"./AddExpression":29,"./AndExpression":30,"./CompareExpression":32,"./ConcatExpression":33,"./CondExpression":34,"./ConstantExpression":35,"./DayOfMonthExpression":36,"./DayOfWeekExpression":37,"./DayOfYearExpression":38,"./DivideExpression":39,"./FieldPathExpression":41,"./HourExpression":43,"./IfNullExpression":44,"./MinuteExpression":45,"./ModExpression":46,"./MonthExpression":47,"./MultiplyExpression":48,"./NotExpression":50,"./ObjectExpression":51,"./OrExpression":52,"./SecondExpression":53,"./StrcasecmpExpression":54,"./SubstrExpression":55,"./SubtractExpression":56,"./ToLowerExpression":57,"./ToUpperExpression":58,"./WeekExpression":59,"./YearExpression":60}],41:[function(require,module,exports){
"use strict";

/**
 * Create a field path expression. Evaluation will extract the value associated with the given field path from the source document.
 * @class FieldPathExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @extends mungedb-aggregate.pipeline.expressions.Expression
 * @constructor
 * @param {String} fieldPath the field path string, without any leading document indicator
 **/
var FieldPathExpression = module.exports = function FieldPathExpression(path){
	if (arguments.length !== 1) throw new Error("args expected: path");
	this.path = new FieldPath(path);
}, klass = FieldPathExpression, base = require("./Expression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var FieldPath = require("../FieldPath");

// PROTOTYPE MEMBERS
proto.evaluate = function evaluate(obj){
	return this._evaluatePath(obj, 0, this.path.fields.length);
};

/**
 * Internal implementation of evaluate(), used recursively.
 *
 * The internal implementation doesn't just use a loop because of the
 * possibility that we need to skip over an array.  If the path is "a.b.c",
 * and a is an array, then we fan out from there, and traverse "b.c" for each
 * element of a:[...].  This requires that a be an array of objects in order
 * to navigate more deeply.
 *
 * @param index current path field index to extract
 * @param pathLength maximum number of fields on field path
 * @param pDocument current document traversed to (not the top-level one)
 * @returns the field found; could be an array
 **/
proto._evaluatePath = function _evaluatePath(obj, i, len){
	var fieldName = this.path.fields[i],
		field = obj[fieldName]; // It is possible we won't have an obj (document) and we need to not fail if that is the case

	// if the field doesn't exist, quit with an undefined value
	if (field === undefined) return undefined;

	// if we've hit the end of the path, stop
	if (++i >= len) return field;

	// We're diving deeper.  If the value was null, return null
	if(field === null) return undefined;

	if (field.constructor === Object) {
		return this._evaluatePath(field, i, len);
	} else if (Array.isArray(field)) {
		var results = [];
		for (var i2 = 0, l2 = field.length; i2 < l2; i2++) {
			var subObj = field[i2],
				subObjType = typeof(subObj);
			if (subObjType === "undefined" || subObj === null) {
				results.push(subObj);
			} else if (subObj.constructor === Object) {
				results.push(this._evaluatePath(subObj, i, len));
			} else {
				throw new Error("the element '" + fieldName + "' along the dotted path '" + this.path.getPath() + "' is not an object, and cannot be navigated.; code 16014");
			}
		}
		return results;
	}
	return undefined;
};

proto.optimize = function(){
	return this;
};

proto.addDependencies = function addDependencies(deps){
	deps[this.path.getPath()] = 1;
	return deps;
};

// renamed write to get because there are no streams
proto.getFieldPath = function getFieldPath(usePrefix){
	return this.path.getPath(usePrefix);
};

proto.toJSON = function toJSON(){
	return this.path.getPath(true);
};

//TODO: proto.addToBsonObj = ...?
//TODO: proto.addToBsonArray = ...?

//proto.writeFieldPath = ...?   use #getFieldPath instead

},{"../FieldPath":4,"./Expression":40}],42:[function(require,module,exports){
"use strict";

/**
 * Create a field range expression.
 *
 * Field ranges are meant to match up with classic Matcher semantics, and therefore are conjunctions.
 *
 * For example, these appear in mongo shell predicates in one of these forms:
 *	{ a : C } -> (a == C) // degenerate "point" range
 *	{ a : { $lt : C } } -> (a < C) // open range
 *	{ a : { $gt : C1, $lte : C2 } } -> ((a > C1) && (a <= C2)) // closed
 *
 * When initially created, a field range only includes one end of the range.  Additional points may be added via intersect().
 *
 * Note that NE and CMP are not supported.
 *
 * @class FieldRangeExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @extends mungedb-aggregate.pipeline.expressions.Expression
 * @constructor
 * @param pathExpr the field path for extracting the field value
 * @param cmpOp the comparison operator
 * @param value the value to compare against
 * @returns the newly created field range expression
 **/
var FieldRangeExpression = module.exports = function FieldRangeExpression(pathExpr, cmpOp, value){
	if (arguments.length !== 3) throw new Error("args expected: pathExpr, cmpOp, and value");
	this.pathExpr = pathExpr;
	this.range = new Range({cmpOp:cmpOp, value:value});
}, klass = FieldRangeExpression, Expression = require("./Expression"), base = Expression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	ConstantExpression = require("./ConstantExpression");

// NESTED CLASSES
var Range = (function(){
	/**
	 * create a new Range; opts is either {cmpOp:..., value:...} or {bottom:..., isBottomOpen:..., top:..., isTopOpen:...}
	 * @private
	 **/
	var klass = function Range(opts){
		this.isBottomOpen = this.isTopOpen = false;
		this.bottom = this.top = undefined;
		if(opts.hasOwnProperty("cmpOp") && opts.hasOwnProperty("value")){
			switch (opts.cmpOp) {
				case Expression.CmpOp.EQ:
					this.bottom = this.top = opts.value;
					break;

				case Expression.CmpOp.GT:
					this.isBottomOpen = true;
					/* falls through */
				case Expression.CmpOp.GTE:
					this.isTopOpen = true;
					this.bottom = opts.value;
					break;

				case Expression.CmpOp.LT:
					this.isTopOpen = true;
					/* falls through */
				case Expression.CmpOp.LTE:
					this.isBottomOpen = true;
					this.top = opts.value;
					break;

				case Expression.CmpOp.NE:
				case Expression.CmpOp.CMP:
					throw new Error("CmpOp not allowed: " + opts.cmpOp);

				default:
					throw new Error("Unexpected CmpOp: " + opts.cmpOp);
			}
		}else{
			this.bottom = opts.bottom;
			this.isBottomOpen = opts.isBottomOpen;
			this.top = opts.top;
			this.isTopOpen = opts.isTopOpen;
		}
	}, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

	// PROTOTYPE MEMBERS
	proto.intersect = function intersect(range){
		// Find the max of the bottom end of ranges
		var maxBottom = range.bottom,
			maxBottomOpen = range.isBottomOpen;
		if(this.bottom !== undefined){
			if(range.bottom === undefined){
				maxBottom = this.bottom;
				maxBottomOpen = this.isBottomOpen;
			}else{
				if(Value.compare(this.bottom, range.bottom) === 0){
					maxBottomOpen = this.isBottomOpen || range.isBottomOpen;
				}else{
					maxBottom = this.bottom;
					maxBottomOpen = this.isBottomOpen;
				}
			}
		}
		// Find the min of the tops of the ranges
		var minTop = range.top,
			minTopOpen = range.isTopOpen;
		if(this.top !== undefined){
			if(range.top === undefined){
				minTop = this.top;
				minTopOpen = this.isTopOpen;
			}else{
				if(Value.compare(this.top, range.top) === 0){
					minTopOpen = this.isTopOpen || range.isTopOpen;
				}else{
					minTop = this.top;
					minTopOpen = this.isTopOpen;
				}
			}
		}
		if(Value.compare(maxBottom, minTop) <= 0)
			return new Range({bottom:maxBottom, isBottomOpen:maxBottomOpen, top:minTop, isTopOpen:minTopOpen});
		return null; // empty intersection
	};

	proto.contains = function contains(value){
		var cmp;
		if(this.bottom !== undefined){
			cmp = Value.compare(value, this.bottom);
			if(cmp < 0) return false;
			if(this.isBottomOpen && cmp === 0) return false;
		}
		if(this.top !== undefined){
			cmp = Value.compare(value, this.top);
			if(cmp > 0) return false;
			if(this.isTopOpen && cmp === 0) return false;
		}
		return true;
	};

	return klass;
})();

// PROTOTYPE MEMBERS
proto.evaluate = function evaluate(obj){
	if(this.range === undefined) return false;
	var value = this.pathExpr.evaluate(obj);
	return this.range.contains(value);
};

proto.optimize = function optimize(){
	if(this.range === undefined) return new ConstantExpression(false);
	if(this.range.bottom === undefined && this.range.top === undefined) return new ConstantExpression(true);
	return this;
};

proto.addDependencies = function(deps){
	return this.pathExpr.addDependencies(deps);
};

/**
 * Add an intersecting range.
 *
 * This can be done any number of times after creation.  The range is
 * internally optimized for each new addition.  If the new intersection
 * extends or reduces the values within the range, the internal
 * representation is adjusted to reflect that.
 *
 * Note that NE and CMP are not supported.
 *
 * @method intersect
 * @param cmpOp the comparison operator
 * @param pValue the value to compare against
 **/
proto.intersect = function intersect(cmpOp, value){
	this.range = this.range.intersect(new Range({cmpOp:cmpOp, value:value}));
};

proto.toJSON = function toJSON(){
	if (this.range === undefined) return false; //nothing will satisfy this predicate
	if (this.range.top === undefined && this.range.bottom === undefined) return true; // any value will satisfy this predicate

	// FIXME Append constant values using the $const operator.  SERVER-6769

	var json = {};
	if (this.range.top === this.range.bottom) {
		json[Expression.CmpOp.EQ] = [this.pathExpr.toJSON(), this.range.top];
	}else{
		var leftOp = {};
		if (this.range.bottom !== undefined) {
			leftOp[this.range.isBottomOpen ? Expression.CmpOp.GT : Expression.CmpOp.GTE] = [this.pathExpr.toJSON(), this.range.bottom];
			if (this.range.top === undefined) return leftOp;
		}

		var rightOp = {};
		if(this.range.top !== undefined){
			rightOp[this.range.isTopOpen ? Expression.CmpOp.LT : Expression.CmpOp.LTE] = [this.pathExpr.toJSON(), this.range.top];
			if (this.range.bottom === undefined) return rightOp;
		}

		json.$and = [leftOp, rightOp];
	}
	return json;
};

//TODO: proto.addToBson = ...?
//TODO: proto.addToBsonObj = ...?
//TODO: proto.addToBsonArray = ...?
//TODO: proto.toMatcherBson = ...? WILL PROBABLY NEED THESE...

},{"../Value":7,"./ConstantExpression":35,"./Expression":40}],43:[function(require,module,exports){
"use strict";

/** 
 * An $hour pipeline expression. 
 * @see evaluate 
 * @class HourExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var HourExpression = module.exports = function HourExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = HourExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$hour";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(1);
	base.prototype.addOperand.call(this, expr);
};

/** 
 * Takes a date and returns the hour between 0 and 23. 
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(1);
	var date = this.operands[0].evaluate(doc);
	return date.getUTCHours();
};

},{"./NaryExpression":49}],44:[function(require,module,exports){
"use strict";

/**
 * An $ifNull pipeline expression.
 * @see evaluate
 * @class IfNullExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var IfNullExpression = module.exports = function IfNullExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = IfNullExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$ifNull";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(2);
	base.prototype.addOperand.call(this, expr);
};

/**
 * Use the $ifNull operator with the following syntax: { $ifNull: [ <expression>, <replacement-if-null> ] }
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(2);
	var left = this.operands[0].evaluate(doc);
	if(left !== undefined && left !== null) return left;
	var right = this.operands[1].evaluate(doc);
	return right;
};

},{"./NaryExpression":49}],45:[function(require,module,exports){
"use strict";

/** 
 * An $minute pipeline expression. 
 * @see evaluate 
 * @class MinuteExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var MinuteExpression = module.exports = function MinuteExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = MinuteExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$minute";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(1);
	base.prototype.addOperand.call(this, expr);
};

/** 
 * Takes a date and returns the minute between 0 and 59. 
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(1);
	var date = this.operands[0].evaluate(doc);
	return date.getUTCMinutes();
};

},{"./NaryExpression":49}],46:[function(require,module,exports){
"use strict";

/** 
 * An $mod pipeline expression. 
 * @see evaluate 
 * @class ModExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var ModExpression = module.exports = function ModExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = ModExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$mod";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(2);
	base.prototype.addOperand.call(this, expr);
};

/** 
 * Takes an array that contains a pair of numbers and returns the remainder of the first number divided by the second number. 
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(2);
	var left = this.operands[0].evaluate(doc),
		right = this.operands[1].evaluate(doc);
	if(left instanceof Date || right instanceof Date) throw new Error("$mod does not support dates; code 16374");

	// pass along jstNULLs and Undefineds
	if(left === undefined || left === null) return left;
	if(right === undefined || right === null) return right;

	// ensure we aren't modding by 0
	right = Value.coerceToDouble(right);
	if(right === 0) return undefined;

	left = Value.coerceToDouble(left);
	return left % right;
};

},{"../Value":7,"./NaryExpression":49}],47:[function(require,module,exports){
"use strict";

/** 
 * A $month pipeline expression. 
 * @see evaluate 
 * @class MonthExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var MonthExpression = module.exports = function MonthExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = MonthExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});
	
// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$month";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(1);
	base.prototype.addOperand.call(this, expr);
};

/**
 * Takes a date and returns the month as a number between 1 and 12.
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(1);
	var date = this.operands[0].evaluate(doc);
	return date.getUTCMonth() + 1;
};

},{"./NaryExpression":49}],48:[function(require,module,exports){
"use strict";

/** 
 * A $multiply pipeline expression. 
 * @see evaluate 
 * @class MultiplyExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var MultiplyExpression = module.exports = function MultiplyExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = MultiplyExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$multiply";
};

/** 
 * Takes an array of one or more numbers and multiples them, returning the resulting product. 
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	var product = 1;
	for(var i = 0, n = this.operands.length; i < n; ++i){
		var value = this.operands[i].evaluate(doc);
		if(value instanceof Date) throw new Error("$multiply does not support dates; code 16375");
		product *= Value.coerceToDouble(value);
	}
	if(typeof(product) != "number") throw new Error("$multiply resulted in a non-numeric type; code 16418");
	return product;
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

},{"../Value":7,"./NaryExpression":49}],49:[function(require,module,exports){
"use strict";

/**
 * The base class for all n-ary `Expression`s
 * @class NaryExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @extends mungedb-aggregate.pipeline.expressions.Expression
 * @constructor
 **/
var NaryExpression = module.exports = function NaryExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	this.operands = [];
	base.call(this);
}, klass = NaryExpression, base = require("./Expression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var ConstantExpression = require("./ConstantExpression");

// PROTOTYPE MEMBERS
proto.evaluate = undefined; // evaluate(doc){ ... defined by inheritor ... }

proto.getOpName = function getOpName(doc){
	throw new Error("NOT IMPLEMENTED BY INHERITOR");
};

proto.optimize = function optimize(){
	var constsFound = 0,
		stringsFound = 0;
	for (var i = 0, l = this.operands.length; i < l; i++) {
		var optimizedExpr = this.operands[i].optimize();
		if (optimizedExpr instanceof ConstantExpression) {
			constsFound++;
			if (typeof(optimizedExpr.value) == "string") stringsFound++;
		}
		this.operands[i] = optimizedExpr;
	}
	// If all the operands are constant, we can replace this expression with a constant.  We can find the value by evaluating this expression over a NULL Document because evaluating the ExpressionConstant never refers to the argument Document.
	if (constsFound === l) return new ConstantExpression(this.evaluate());
	// If there are any strings, we can't re-arrange anything, so stop now.     LATER:  we could concatenate adjacent strings as a special case.
	if (stringsFound) return this;
	// If there's no more than one constant, then we can't do any constant folding, so don't bother going any further.
	if (constsFound <= 1) return this;
	// If the operator isn't commutative or associative, there's nothing more we can do.  We test that by seeing if we can get a factory; if we can, we can use it to construct a temporary expression which we'll evaluate to collapse as many constants as we can down to a single one.
	var IExpression = this.getFactory();
	if (!(IExpression instanceof Function)) return this;
	// Create a new Expression that will be the replacement for this one.  We actually create two:  one to hold constant expressions, and one to hold non-constants.
	// Once we've got these, we evaluate the constant expression to produce a single value, as above.  We then add this operand to the end of the non-constant expression, and return that.
	var expr = new IExpression(),
		constExpr = new IExpression();
	for (i = 0; i < l; ++i) {
		var operandExpr = this.operands[i];
		if (operandExpr instanceof ConstantExpression) {
			constExpr.addOperand(operandExpr);
		} else {
			// If the child operand is the same type as this, then we can extract its operands and inline them here because we already know this is commutative and associative because it has a factory.  We can detect sameness of the child operator by checking for equality of the factory
			// Note we don't have to do this recursively, because we called optimize() on all the children first thing in this call to optimize().
			if (!(operandExpr instanceof NaryExpression)) {
				expr.addOperand(operandExpr);
			} else {
				if (operandExpr.getFactory() !== IExpression) {
					expr.addOperand(operandExpr);
				} else { // same factory, so flatten
					for (var i2 = 0, n2 = operandExpr.operands.length; i2 < n2; ++i2) {
						var childOperandExpr = operandExpr.operands[i2];
						if (childOperandExpr instanceof ConstantExpression) {
							constExpr.addOperand(childOperandExpr);
						} else {
							expr.addOperand(childOperandExpr);
						}
					}
				}
			}
		}
	}

	if (constExpr.operands.length === 1) { // If there was only one constant, add it to the end of the expression operand vector.
		expr.addOperand(constExpr.operands[0]);
	} else if (constExpr.operands.length > 1) { // If there was more than one constant, collapse all the constants together before adding the result to the end of the expression operand vector.
		var pResult = constExpr.evaluate();
		expr.addOperand(new ConstantExpression(pResult));
	}

	return expr;
};

proto.addDependencies = function addDependencies(deps){
	for(var i = 0, l = this.operands.length; i < l; ++i)
		this.operands[i].addDependencies(deps);
	return deps;
};

/**
 * Add an operand to the n-ary expression.
 * @method addOperand
 * @param pExpression the expression to add
 **/
proto.addOperand = function addOperand(expr) {
	this.operands.push(expr);
};

proto.getFactory = function getFactory() {
	return undefined;
};

proto.toJSON = function toJSON() {
	var o = {};
	o[this.getOpName()] = this.operands.map(function(operand){
		return operand.toJSON();
	});
	return o;
};

//TODO:	proto.toBson  ?   DONE NOW???
//TODO:	proto.addToBsonObj  ?
//TODO: proto.addToBsonArray  ?

/**
 * Checks the current size of vpOperand; if the size equal to or greater than maxArgs, fires a user assertion indicating that this operator cannot have this many arguments.
 * The equal is there because this is intended to be used in addOperand() to check for the limit *before* adding the requested argument.
 *
 * @method checkArgLimit
 * @param maxArgs the maximum number of arguments the operator accepts
 **/
proto.checkArgLimit = function checkArgLimit(maxArgs) {
	if (this.operands.length >= maxArgs) throw new Error(this.getOpName() + " only takes " + maxArgs + " operand" + (maxArgs == 1 ? "" : "s") + "; code 15993");
};

/**
 * Checks the current size of vpOperand; if the size is not equal to reqArgs, fires a user assertion indicating that this must have exactly reqArgs arguments.
 * This is meant to be used in evaluate(), *before* the evaluation takes place.
 *
 * @method checkArgCount
 * @param reqArgs the number of arguments this operator requires
 **/
proto.checkArgCount = function checkArgCount(reqArgs) {
	if (this.operands.length !== reqArgs) throw new Error(this.getOpName() + ":  insufficient operands; " + reqArgs + " required, only got " + this.operands.length + "; code 15997");
};
},{"./ConstantExpression":35,"./Expression":40}],50:[function(require,module,exports){
"use strict";

/** 
 * A $not pipeline expression. 
 * @see evaluate 
 * @class NotExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var NotExpression = module.exports = function NotExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = NotExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$not";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(1);
	base.prototype.addOperand.call(this, expr);
};

/** 
 * Returns the boolean opposite value passed to it. When passed a true value, $not returns false; when passed a false value, $not returns true. 
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(1);
	var op = this.operands[0].evaluate(doc);
	return !Value.coerceToBool(op);
};

},{"../Value":7,"./NaryExpression":49}],51:[function(require,module,exports){
"use strict";

/**
 * Create an empty expression.  Until fields are added, this will evaluate to an empty document (object).
 * @class ObjectExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @extends mungedb-aggregate.pipeline.expressions.Expression
 * @constructor
 **/
var ObjectExpression = module.exports = function ObjectExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	this.excludeId = false;	/// <Boolean> for if _id is to be excluded
	this._expressions = {};	/// <Object<Expression>> mapping from fieldname to Expression to generate the value NULL expression means include from source document
	this._order = []; /// <Array<String>> this is used to maintain order for generated fields not in the source document
}, klass = ObjectExpression, Expression = require("./Expression"), base = Expression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Document = require("../Document"),
	FieldPath = require("../FieldPath");

// INSTANCE VARIABLES
/**
 * <Boolean> for if _id is to be excluded
 * @property excludeId
 **/
proto.excludeId = undefined;

/**
 * <Object<Expression>> mapping from fieldname to Expression to generate the value NULL expression means include from source document
 **/
proto._expressions = undefined;

//TODO: might be able to completely ditch _order everywhere in here since `Object`s are mostly ordered anyhow but need to come back and revisit that later
/**
 * <Array<String>> this is used to maintain order for generated fields not in the source document
 **/
proto._order = [];


// PROTOTYPE MEMBERS

/**
 * evaluate(), but return a Document instead of a Value-wrapped Document.
 * @method evaluateDocument
 * @param pDocument the input Document
 * @returns the result document
 **/
proto.evaluateDocument = function evaluateDocument(doc) {
	// create and populate the result
	var pResult = {};
	this.addToDocument(pResult, pResult, doc); // No inclusion field matching.
	return pResult;
};

proto.evaluate = function evaluate(doc) { //TODO: collapse with #evaluateDocument()?
	return this.evaluateDocument(doc);
};

proto.optimize = function optimize(){
	for (var key in this._expressions) {
		var expr = this._expressions[key];
		if (expr !== undefined && expr !== null) this._expressions[key] = expr.optimize();
	}
	return this;
};

proto.getIsSimple = function getIsSimple(){
	for (var key in this._expressions) {
		var expr = this._expressions[key];
		if (expr !== undefined && expr !== null && !expr.getIsSimple()) return false;
	}
	return true;
};

proto.addDependencies = function addDependencies(deps, path){
	var depsSet = {};
	var pathStr = "";
	if (path instanceof Array) {
		if (path.length === 0) {
			// we are in the top level of a projection so _id is implicit
			if (!this.excludeId) depsSet[Document.ID_PROPERTY_NAME] = 1;
		} else {
			pathStr = new FieldPath(path).getPath() + ".";
		}
	} else {
		if (this.excludeId) throw new Error("excludeId is true!");
	}
	for (var key in this._expressions) {
		var expr = this._expressions[key];
		if (expr !== undefined && expr !== null) {
			if (path instanceof Array) path.push(key);
			expr.addDependencies(deps, path);
			if (path instanceof Array) path.pop();
		} else { // inclusion
			if (path === undefined || path === null) throw new Error("inclusion not supported in objects nested in $expressions; uassert code 16407");
			depsSet[pathStr + key] = 1;
		}
	}
	//Array.prototype.push.apply(deps, Object.getOwnPropertyNames(depsSet));
	for(key in depsSet) {
		deps[key] = 1;
	}
	return deps;	// NOTE: added to munge as a convenience
};

/**
 * evaluate(), but add the evaluated fields to a given document instead of creating a new one.
 * @method addToDocument
 * @param pResult the Document to add the evaluated expressions to
 * @param pDocument the input Document for this level
 * @param rootDoc the root of the whole input document
 **/
proto.addToDocument = function addToDocument(pResult, pDocument, rootDoc){
	var atRoot = (pDocument === rootDoc);

	var doneFields = {};	// This is used to mark fields we've done so that we can add the ones we haven't

	for(var fieldName in pDocument){
		if (!pDocument.hasOwnProperty(fieldName)) continue;
		var fieldValue = pDocument[fieldName];

		// This field is not supposed to be in the output (unless it is _id)
		if (!this._expressions.hasOwnProperty(fieldName)) {
			if (!this.excludeId && atRoot && fieldName == Document.ID_PROPERTY_NAME) {
				// _id from the root doc is always included (until exclusion is supported)
				// not updating doneFields since "_id" isn't in _expressions
				pResult[fieldName] = fieldValue;
			}
			continue;
		}

		// make sure we don't add this field again
		doneFields[fieldName] = true;

		// This means pull the matching field from the input document
		var expr = this._expressions[fieldName];
		if (!(expr instanceof Expression)) {
			pResult[fieldName] = fieldValue;
			continue;
		}

		// Check if this expression replaces the whole field
		if (!(fieldValue instanceof Object) || (fieldValue.constructor !== Object && fieldValue.constructor !== Array) || !(expr instanceof ObjectExpression)) {
			var pValue = expr.evaluate(rootDoc);

			// don't add field if nothing was found in the subobject
			if (expr instanceof ObjectExpression && pValue instanceof Object && Object.getOwnPropertyNames(pValue).length === 0) continue;

			// Don't add non-existent values (note:  different from NULL); this is consistent with existing selection syntax which doesn't force the appearnance of non-existent fields.
			// TODO make missing distinct from Undefined
			if (pValue !== undefined) pResult[fieldName] = pValue;
			continue;
		}

		// Check on the type of the input value.  If it's an object, just walk down into that recursively, and add it to the result.
		if (fieldValue instanceof Object && fieldValue.constructor === Object) {
			pResult[fieldName] = expr.addToDocument({}, fieldValue, rootDoc);	//TODO: pretty sure this is broken;
		} else if (fieldValue instanceof Object && fieldValue.constructor === Array) {
			// If it's an array, we have to do the same thing, but to each array element.  Then, add the array of results to the current document.
			var result = [];
			for(var fvi = 0, fvl = fieldValue.length; fvi < fvl; fvi++){
				var subValue = fieldValue[fvi];
				if (subValue.constructor !== Object) continue;	// can't look for a subfield in a non-object value.
				result.push(expr.addToDocument({}, subValue, rootDoc));
			}
			pResult[fieldName] = result;
		} else {
			throw new Error("should never happen");	//verify( false );
		}
	}

	if (Object.getOwnPropertyNames(doneFields).length == Object.getOwnPropertyNames(this._expressions).length) return pResult;	//NOTE: munge returns result as a convenience

	// add any remaining fields we haven't already taken care of
	for(var i = 0, l = this._order.length; i < l; i++){
		var fieldName2 = this._order[i];
		var expr2 = this._expressions[fieldName2];

		// if we've already dealt with this field, above, do nothing
		if (doneFields.hasOwnProperty(fieldName2)) continue;

		// this is a missing inclusion field
		if (!expr2) continue;

		var value = expr2.evaluate(rootDoc);

		// Don't add non-existent values (note:  different from NULL); this is consistent with existing selection syntax which doesn't force the appearnance of non-existent fields.
		if (value === undefined) continue;

		// don't add field if nothing was found in the subobject
		if (expr2 instanceof ObjectExpression && value && value instanceof Object && Object.getOwnPropertyNames(value).length === 0) continue;

		pResult[fieldName2] = value;
	}

	return pResult;	//NOTE: munge returns result as a convenience
};

/**
 * estimated number of fields that will be output
 * @method getSizeHint
 **/
proto.getSizeHint = function getSizeHint(){
	// Note: this can overestimate, but that is better than underestimating
	return Object.getOwnPropertyNames(this._expressions).length + (this.excludeId ? 0 : 1);
};

/**
 * Add a field to the document expression.
 * @method addField
 * @param fieldPath the path the evaluated expression will have in the result Document
 * @param pExpression the expression to evaluate obtain this field's Value in the result Document
 **/
proto.addField = function addField(fieldPath, pExpression){
	if(!(fieldPath instanceof FieldPath)) fieldPath = new FieldPath(fieldPath);
	var fieldPart = fieldPath.fields[0],
		haveExpr = this._expressions.hasOwnProperty(fieldPart),
		subObj = this._expressions[fieldPart];	// inserts if !haveExpr //NOTE: not in munge & JS it doesn't, handled manually below

	if (!haveExpr) {
		this._order.push(fieldPart);
	} else { // we already have an expression or inclusion for this field
		if (fieldPath.getPathLength() == 1) { // This expression is for right here
			if (!(subObj instanceof ObjectExpression && typeof pExpression == "object" && pExpression instanceof ObjectExpression)){
				throw new Error("can't add an expression for field `" + fieldPart + "` because there is already an expression for that field or one of its sub-fields; uassert code 16400"); // we can merge them
			}

			// Copy everything from the newSubObj to the existing subObj
			// This is for cases like { $project:{ 'b.c':1, b:{ a:1 } } }
			for (var key in pExpression._expressions) {
				if (pExpression._expressions.hasOwnProperty(key)) {
					subObj.addField(key, pExpression._expressions[key]); // asserts if any fields are dupes
				}
			}
			return;
		} else { // This expression is for a subfield
			if(!subObj) throw new Error("can't add an expression for a subfield of `" + fieldPart + "` because there is already an expression that applies to the whole field; uassert code 16401");
		}
	}

	if (fieldPath.getPathLength() == 1) {
		if(haveExpr) throw new Error("Internal error."); // haveExpr case handled above.
		this._expressions[fieldPart] = pExpression;
		return;
	}

	if (!haveExpr) subObj = this._expressions[fieldPart] = new ObjectExpression();

	subObj.addField(fieldPath.tail(), pExpression);
};

/**
 * Add a field path to the set of those to be included.
 *
 * Note that including a nested field implies including everything on the path leading down to it.
 *
 * @method includePath
 * @param fieldPath the name of the field to be included
 **/
proto.includePath = function includePath(path){
	this.addField(path, undefined);
};

/**
 * Get a count of the added fields.
 * @method getFieldCount
 * @returns how many fields have been added
 **/
proto.getFieldCount = function getFieldCount(){
	return Object.getOwnPropertyNames(this._expressions).length;
};

///**
//* Specialized BSON conversion that allows for writing out a $project specification.
//* This creates a standalone object, which must be added to a containing object with a name
//*
//* @param pBuilder where to write the object to
//* @param requireExpression see Expression::addToBsonObj
//**/
//TODO:	proto.documentToBson = ...?
//TODO:	proto.addToBsonObj = ...?
//TODO: proto.addToBsonArray = ...?

//NOTE: in `munge` we're not passing the `Object`s in and allowing `toJSON` (was `documentToBson`) to modify it directly and are instead building and returning a new `Object` since that's the way it's actually used
proto.toJSON = function toJSON(requireExpression){
	var o = {};
	if (this.excludeId) o[Document.ID_PROPERTY_NAME] = false;
	for (var i = 0, l = this._order.length; i < l; i++) {
		var fieldName = this._order[i];
		if (!this._expressions.hasOwnProperty(fieldName)) throw new Error("internal error: fieldName from _ordered list not found in _expressions");
		var fieldValue = this._expressions[fieldName];
		if (fieldValue === undefined) {
			o[fieldName] = true; // this is inclusion, not an expression
		} else {
			o[fieldName] = fieldValue.toJSON(requireExpression);
		}
	}
	return o;
};

},{"../Document":3,"../FieldPath":4,"./Expression":40}],52:[function(require,module,exports){
"use strict";

/** 
 * An $or pipeline expression. 
 * @see evaluate 
 * @class OrExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var OrExpression = module.exports = function OrExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = OrExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	ConstantExpression = require("./ConstantExpression"),
	CoerceToBoolExpression = require("./CoerceToBoolExpression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$or";
};

/** 
 * Takes an array of one or more values and returns true if any of the values in the array are true. Otherwise $or returns false. 
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	for(var i = 0, n = this.operands.length; i < n; ++i){
		var value = this.operands[i].evaluate(doc);
		if (Value.coerceToBool(value)) return true;
	}
	return false;
};

proto.optimize = function optimize() {
	var pE = base.prototype.optimize.call(this); // optimize the disjunction as much as possible

	if (!(pE instanceof OrExpression)) return pE; // if the result isn't a disjunction, we can't do anything
	var pOr = pE;

	// Check the last argument on the result; if it's not const (as promised
	// by ExpressionNary::optimize(),) then there's nothing we can do.
	var n = pOr.operands.length;
	// ExpressionNary::optimize() generates an ExpressionConstant for {$or:[]}.
	if (!n) throw new Error("OrExpression must have operands!");
	var pLast = pOr.operands[n - 1];
	if (!(pLast instanceof ConstantExpression)) return pE;

	// Evaluate and coerce the last argument to a boolean.  If it's true, then we can replace this entire expression.
	var last = Value.coerceToBool(pLast.evaluate());
	if (last) return new ConstantExpression(true);

	// If we got here, the final operand was false, so we don't need it anymore.
	// If there was only one other operand, we don't need the conjunction either.  Note we still need to keep the promise that the result will be a boolean.
	if (n == 2) return new CoerceToBoolExpression(pOr.operands[0]);

	// Remove the final "false" value, and return the new expression.
	pOr.operands.length = n - 1;
	return pE;
};

proto.getFactory = function getFactory(){
	return klass;	// using the ctor rather than a separate .create() method
};

},{"../Value":7,"./CoerceToBoolExpression":31,"./ConstantExpression":35,"./NaryExpression":49}],53:[function(require,module,exports){
"use strict";

/** 
 * An $second pipeline expression. 
 * @see evaluate 
 * @class SecondExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SecondExpression = module.exports = function SecondExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = SecondExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$second";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(1);
	base.prototype.addOperand.call(this, expr);
};

/**
 * Takes a date and returns the second between 0 and 59, but can be 60 to account for leap seconds.
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(1);
	var date = this.operands[0].evaluate(doc);
	return date.getUTCSeconds();	//TODO: incorrect for last second of leap year, need to fix...
	// currently leap seconds are unsupported in v8
	// http://code.google.com/p/v8/issues/detail?id=1944
};

},{"./NaryExpression":49}],54:[function(require,module,exports){
"use strict";

/** 
 * A $strcasecmp pipeline expression.
 * @see evaluate 
 * @class StrcasecmpExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var StrcasecmpExpression = module.exports = function StrcasecmpExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = StrcasecmpExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	NaryExpression = require("./NaryExpression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$strcasecmp";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(2);
	base.prototype.addOperand.call(this, expr);
};

/** 
 * Takes in two strings. Returns a number. $strcasecmp is positive if the first string is “greater than” the second and negative if the first string is “less than” the second. $strcasecmp returns 0 if the strings are identical. 
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(2);
	var val1 = this.operands[0].evaluate(doc),
		val2 = this.operands[1].evaluate(doc),
		str1 = Value.coerceToString(val1).toUpperCase(),
		str2 = Value.coerceToString(val2).toUpperCase(),
		cmp = Value.compare(str1, str2);
	return cmp;
};

},{"../Value":7,"./NaryExpression":49}],55:[function(require,module,exports){
"use strict";

/**
 * A $substr pipeline expression.
 * @see evaluate 
 * @class SubstrExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SubstrExpression = module.exports = function SubstrExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = SubstrExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$substr";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(3);
	base.prototype.addOperand.call(this, expr);
};

/**
 * Takes a string and two numbers. The first number represents the number of bytes in the string to skip, and the second number specifies the number of bytes to return from the string.
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc) {
	this.checkArgCount(3);
	var val = this.operands[0].evaluate(doc),
		idx = this.operands[1].evaluate(doc),
		len = this.operands[2].evaluate(doc),
		str = Value.coerceToString(val);
	if (typeof(idx) != "number") throw new Error(this.getOpName() + ": starting index must be a numeric type; code 16034");
	if (typeof(len) != "number") throw new Error(this.getOpName() + ": length must be a numeric type; code 16035");
	if (idx >= str.length) return "";
	//TODO: Need to handle -1
	len = (len === -1 ? undefined : len);
	return str.substr(idx, len);
};

},{"../Value":7,"./NaryExpression":49}],56:[function(require,module,exports){
"use strict";

/** 
 * A $subtract pipeline expression.
 * @see evaluate 
 * @class SubtractExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var SubtractExpression = module.exports = function SubtractExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = SubtractExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$subtract";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(2);
	base.prototype.addOperand.call(this, expr);
};

/** 
* Takes an array that contains a pair of numbers and subtracts the second from the first, returning their difference. 
**/
proto.evaluate = function evaluate(doc) {
	this.checkArgCount(2);
	var left = this.operands[0].evaluate(doc),
		right = this.operands[1].evaluate(doc);
	return left - right;
};

},{"../Value":7,"./NaryExpression":49}],57:[function(require,module,exports){
"use strict";
	
/** 
 * A $toLower pipeline expression.
 * @see evaluate 
 * @class ToLowerExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var ToLowerExpression = module.exports = function ToLowerExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = ToLowerExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$toLower";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(1);
	base.prototype.addOperand.call(this, expr);
};

/** 
* Takes a single string and converts that string to lowercase, returning the result. All uppercase letters become lowercase. 
**/
proto.evaluate = function evaluate(doc) {
	this.checkArgCount(1);
	var val = this.operands[0].evaluate(doc),
		str = Value.coerceToString(val);
	return str.toLowerCase();
};

},{"../Value":7,"./NaryExpression":49}],58:[function(require,module,exports){
"use strict";

/** 
 * A $toUpper pipeline expression.
 * @see evaluate 
 * @class ToUpperExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var ToUpperExpression = module.exports = function ToUpperExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = ToUpperExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$toUpper";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(1);
	base.prototype.addOperand.call(this, expr);
};

/** 
* Takes a single string and converts that string to lowercase, returning the result. All uppercase letters become lowercase. 
**/
proto.evaluate = function evaluate(doc) {
	this.checkArgCount(1);
	var val = this.operands[0].evaluate(doc),
		str = Value.coerceToString(val);
	return str.toUpperCase();
};

},{"../Value":7,"./NaryExpression":49}],59:[function(require,module,exports){
"use strict";

/** 
 * A $week pipeline expression.
 * @see evaluate 
 * @class WeekExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var WeekExpression = module.exports = function WeekExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = WeekExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	DayOfYearExpression = require("./DayOfYearExpression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$week";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(1);
	base.prototype.addOperand.call(this, expr);
};

/** 
 * Takes a date and returns the week of the year as a number between 0 and 53. 
 * Weeks begin on Sundays, and week 1 begins with the first Sunday of the year. 
 * Days preceding the first Sunday of the year are in week 0. 
 * This behavior is the same as the “%U” operator to the strftime standard library function.
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc) {
	this.checkArgCount(1);
	var date = this.operands[0].evaluate(doc),
		dayOfWeek = date.getUTCDay(),
		dayOfYear = DayOfYearExpression.getDateDayOfYear(date),
		prevSundayDayOfYear = dayOfYear - dayOfWeek,	// may be negative
		nextSundayDayOfYear = prevSundayDayOfYear + 7;	// must be positive
	// Return the zero based index of the week of the next sunday, equal to the one based index of the week of the previous sunday, which is to be returned.
	return (nextSundayDayOfYear / 7) | 0; // also, the `| 0` here truncates this so that we return an integer
};

},{"../Value":7,"./DayOfYearExpression":38,"./NaryExpression":49}],60:[function(require,module,exports){
"use strict";

/** 
 * A $year pipeline expression.
 * @see evaluate 
 * @class YearExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var YearExpression = module.exports = function YearExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = YearExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value"),
	DayOfYearExpression = require("./DayOfYearExpression");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$year";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(1);
	base.prototype.addOperand.call(this, expr);
};

/**
 * Takes a date and returns the full year.
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc) {
	this.checkArgCount(1);
	var date = this.operands[0].evaluate(doc);
	return date.getUTCFullYear();
};

},{"../Value":7,"./DayOfYearExpression":38,"./NaryExpression":49}],61:[function(require,module,exports){
"use strict";
module.exports = {
	AddExpression: require("./AddExpression.js"),
	AndExpression: require("./AndExpression.js"),
	CoerceToBoolExpression: require("./CoerceToBoolExpression.js"),
	CompareExpression: require("./CompareExpression.js"),
	CondExpression: require("./CondExpression.js"),
	ConstantExpression: require("./ConstantExpression.js"),
	DayOfMonthExpression: require("./DayOfMonthExpression.js"),
	DayOfWeekExpression: require("./DayOfWeekExpression.js"),
	DayOfYearExpression: require("./DayOfYearExpression.js"),
	DivideExpression: require("./DivideExpression.js"),
	Expression: require("./Expression.js"),
	FieldPathExpression: require("./FieldPathExpression.js"),
	FieldRangeExpression: require("./FieldRangeExpression.js"),
	HourExpression: require("./HourExpression.js"),
	IfNullExpression: require("./IfNullExpression.js"),
	MinuteExpression: require("./MinuteExpression.js"),
	ModExpression: require("./ModExpression.js"),
	MonthExpression: require("./MonthExpression.js"),
	MultiplyExpression: require("./MultiplyExpression.js"),
	NaryExpression: require("./NaryExpression.js"),
	NotExpression: require("./NotExpression.js"),
	ObjectExpression: require("./ObjectExpression.js"),
	OrExpression: require("./OrExpression.js"),
	SecondExpression: require("./SecondExpression.js"),
	StrcasecmpExpression: require("./StrcasecmpExpression.js"),
	SubstrExpression: require("./SubstrExpression.js"),
	SubtractExpression: require("./SubtractExpression.js"),
	ToLowerExpression: require("./ToLowerExpression.js"),
	ToUpperExpression: require("./ToUpperExpression.js"),
	WeekExpression: require("./WeekExpression.js"),
	YearExpression: require("./YearExpression.js")
};

},{"./AddExpression.js":29,"./AndExpression.js":30,"./CoerceToBoolExpression.js":31,"./CompareExpression.js":32,"./CondExpression.js":34,"./ConstantExpression.js":35,"./DayOfMonthExpression.js":36,"./DayOfWeekExpression.js":37,"./DayOfYearExpression.js":38,"./DivideExpression.js":39,"./Expression.js":40,"./FieldPathExpression.js":41,"./FieldRangeExpression.js":42,"./HourExpression.js":43,"./IfNullExpression.js":44,"./MinuteExpression.js":45,"./ModExpression.js":46,"./MonthExpression.js":47,"./MultiplyExpression.js":48,"./NaryExpression.js":49,"./NotExpression.js":50,"./ObjectExpression.js":51,"./OrExpression.js":52,"./SecondExpression.js":53,"./StrcasecmpExpression.js":54,"./SubstrExpression.js":55,"./SubtractExpression.js":56,"./ToLowerExpression.js":57,"./ToUpperExpression.js":58,"./WeekExpression.js":59,"./YearExpression.js":60}],62:[function(require,module,exports){
"use strict";
module.exports = {
	Pipeline: require("./Pipeline"),
	PipelineD: require("./PipelineD"),
	FieldPath: require("./FieldPath"),
	Document: require("./Document"),
	Value: require("./Value"),
	accumulators: require("./accumulators/"),
	documentSources: require("./documentSources/"),
	expressions: require("./expressions/")
};

},{"./Document":3,"./FieldPath":4,"./Pipeline":5,"./PipelineD":6,"./Value":7,"./accumulators/":17,"./documentSources/":28,"./expressions/":61}],63:[function(require,module,exports){
(function (process){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(done) );
        });
        function done(err) {
          if (err) {
              callback(err);
              callback = function () {};
          }
          else {
              completed += 1;
              if (completed >= arr.length) {
                  callback();
              }
          }
        }
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        if (!callback) {
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err) {
                    callback(err);
                });
            });
        } else {
            var results = [];
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        var remainingTasks = keys.length
        if (!remainingTasks) {
            return callback();
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            remainingTasks--
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (!remainingTasks) {
                var theCallback = callback;
                // prevent final callback from calling itself if it errors
                callback = function () {};

                theCallback(null, results);
            }
        });

        _each(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var attempts = [];
        // Use defaults if times not passed
        if (typeof times === 'function') {
            callback = task;
            task = times;
            times = DEFAULT_TIMES;
        }
        // Make sure times is a number
        times = parseInt(times, 10) || DEFAULT_TIMES;
        var wrappedTask = function(wrappedCallback, wrappedResults) {
            var retryAttempt = function(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            };
            while (times) {
                attempts.push(retryAttempt(task, !(times-=1)));
            }
            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || callback)(data.err, data.result);
            });
        }
        // If a callback is passed, run this as a controll flow
        return callback ? wrappedTask() : wrappedTask
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!_isArray(tasks)) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (test.apply(null, args)) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (!test.apply(null, args)) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            started: false,
            paused: false,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            kill: function () {
              q.drain = null;
              q.tasks = [];
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                if (q.paused === true) { return; }
                q.paused = true;
                q.process();
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                q.process();
            }
        };
        return q;
    };
    
    async.priorityQueue = function (worker, concurrency) {
        
        function _compareTasks(a, b){
          return a.priority - b.priority;
        };
        
        function _binarySearch(sequence, item, compare) {
          var beg = -1,
              end = sequence.length - 1;
          while (beg < end) {
            var mid = beg + ((end - beg + 1) >>> 1);
            if (compare(item, sequence[mid]) >= 0) {
              beg = mid;
            } else {
              end = mid - 1;
            }
          }
          return beg;
        }
        
        function _insert(q, data, priority, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  priority: priority,
                  callback: typeof callback === 'function' ? callback : null
              };
              
              q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }
        
        // Start with a normal queue
        var q = async.queue(worker, concurrency);
        
        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
          _insert(q, data, priority, callback);
        };
        
        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            drained: true,
            push: function (data, callback) {
                if (!_isArray(data)) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    cargo.drained = false;
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain && !cargo.drained) cargo.drain();
                    cargo.drained = true;
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0, tasks.length);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    async.compose = function (/* functions... */) {
      return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'))
},{"_process":65}],64:[function(require,module,exports){
/*
 * Sift
 *
 * Copryright 2011, Craig Condon
 * Licensed under MIT
 *
 * Inspired by mongodb's query language
 */


(function() {


  /**
   */

  var _convertDotToSubObject = function(keyParts, value) {

    var subObject = {},
    currentValue = subObject;

    for(var i = 0, n = keyParts.length - 1; i < n; i++) {
      currentValue = currentValue[keyParts[i]] = {};
    }

    currentValue[keyParts[i]] = value;

    return subObject;
  }

  /**
   */

  var _queryParser = new (function() {

    /**
     * tests against data
     */

    var priority = this.priority = function(statement, data) {

      var exprs = statement.exprs,
      priority = 0;

      //generally, expressions are ordered from least efficient, to most efficient.
      for(var i = 0, n = exprs.length; i < n; i++) {

        var expr = exprs[i],
        p;

        if(!~(p = expr.e(expr.v, _comparable(data), data))) return -1;

        priority += p;

      }


      return priority;
    }


    /**
     * parses a statement into something evaluable
     */

    var parse = this.parse = function(statement, key) {

      //fixes sift(null, []) issue
      if(!statement) statement = { $eq: statement };

      var testers = [];

      //if the statement is an object, then we're looking at something like: { key: match }
      if(Object.prototype.toString.call(statement) === "[object Object]") {

        for(var k in statement) {

          //find the apropriate operator. If one doesn't exist and the key does not start
          //with a $ character, then it's a property, which means we create a new statement
          //(traversing)
          var operator;
          if (!!_testers[k]) {
            operator = k;
          } else if (k.substr(0, 1) !== '$') {
            operator = '$trav';
          } else {
            throw new Error('Unknown operator.');
          }

          //value of given statement (the match)
          var value = statement[k];

          //default = match
          var exprValue = value;

          //if we're working with a traversable operator, then set the expr value
          if(TRAV_OP[operator]) {


            //using dot notation? convert into a sub-object
            if(~k.indexOf(".")) {
              var keyParts = k.split(".");
              k = keyParts.shift(); //we're using the first key, so remove it

              exprValue = value = _convertDotToSubObject(keyParts, value);
            }

            //*if* the value is an array, then we're dealing with something like: $or, $and
            if(value instanceof Array) {

              exprValue = [];

              for(var i = value.length; i--;) {
                exprValue.push(parse(value[i]));
              }

            //otherwise we're dealing with $trav
            } else {
              exprValue = parse(value, k);
            }
          }

          testers.push(_getExpr(operator, k, exprValue));

        }


      //otherwise we're comparing a particular value, so set to eq
      } else {
        testers.push(_getExpr('$eq', k, statement));
      }

      var stmt =  {
        exprs: testers,
        k: key,
        test: function(value) {
          return !!~stmt.priority(value);
        },
        priority: function(value) {
          return priority(stmt, value);
        }
      };

      return stmt;

    }


    //traversable statements
    var TRAV_OP = this.traversable = {
      $and: true,
      $or: true,
      $nor: true,
      $trav: true,
      $not: true
    };


    function _comparable(value) {
      if(value instanceof Date) {
        return value.getTime();
      } else {
        return value;
      }
    }

    function btop(value) {
      return value ? 0 : -1;
    }

    var _testers = this.testers =  {

      /**
       */

      $eq: function(a, b) {
        return btop(a.test(b));
      },

      /**
       */

      $ne: function(a, b) {
        return btop(!a.test(b));
      },

      /**
       */

      $lt: function(a, b) {
        return btop(a > b);
      },

      /**
       */

      $gt: function(a, b) {
        return btop(a < b);
      },

      /**
       */

      $lte: function(a, b) {
        return btop(a >= b);
      },

      /**
       */

      $gte: function(a, b) {
        return btop(a <= b);
      },


      /**
       */

      $exists: function(a, b) {
        return btop(a === (b != null))
      },

      /**
       */

      $in: function(a, b) {

        //intersecting an array
        if(b instanceof Array) {

          for(var i = b.length; i--;) {
            if(~a.indexOf(b[i])) return i;
          }

        } else {
          return btop(~a.indexOf(b));
        }


        return -1;
      },

      /**
       */

      $not: function(a, b) {
        if(!a.test) throw new Error("$not test should include an expression, not a value. Use $ne instead.");
        return btop(!a.test(b));
      },

      /**
       */

      $type: function(a, b, org) {

        //instanceof doesn't work for strings / boolean. instanceof works with inheritance
        return org ? btop(org instanceof a || org.constructor == a) : -1;
      },

      /**
       */


      $nin: function(a, b) {
        return ~_testers.$in(a, b) ? -1 : 0;
      },

      /**
       */

      $mod: function(a, b) {
        return b % a[0] == a[1] ? 0 : -1;
      },

      /**
       */

      $all: function(a, b) {
        if (!b) b = [];
        for(var i = a.length; i--;) {
          var a1 = a[i];
          var indexInB = ~b.indexOf(a1);
          if(!indexInB) return -1;
        }

        return 0;
      },

      /**
       */

      $size: function(a, b) {
        return b ? btop(a == b.length) : -1;
      },

      /**
       */

      $or: function(a, b) {

        var i = a.length, p, n = i;

        for(; i--;) {
          if(~priority(a[i], b)) {
            return i;
          }
        }

        return btop(n == 0);
      },

      /**
       */

      $nor: function(a, b) {

        var i = a.length, n = i;

        for(; i--;) {
          if(~priority(a[i], b)) {
            return -1;
          }
        }

        return 0;
      },

      /**
       */

      $and: function(a, b) {

        for(var i = a.length; i--;) {
          if(!~priority(a[i], b)) {
            return -1;
          }
        }

        return 0;
      },

      /**
       */

      $trav: function(a, b) {



        if(b instanceof Array) {

          for(var i = b.length; i--;) {
            var subb = b[i];
            if(subb[a.k] && ~priority(a, subb[a.k])) return i;
          }

          return -1;
        }

        //continue to traverse even if there isn't a value - this is needed for
        //something like name:{$exists:false}
        return priority(a, b ? b[a.k] : void 0);
      },

      /**
       */

      $regex: function(a, b) {
        var aRE = new RegExp(a);
        return aRE.test(b) ? 0 : -1;
      }


    }

    var _prepare = {

      /**
       */

      $eq: function(a) {

        var fn;

        if(a instanceof RegExp) {
          return a;
        } else if (a instanceof Function) {
          fn = a;
        } else {

          fn = function(b) {
            if(b instanceof Array) {
              return ~b.indexOf(a);
            } else {
              return a == b;
            }
          }
        }

        return {
          test: fn
        }

      },

      /**
       */

       $ne: function(a) {
        return _prepare.$eq(a);
       }
    };



    var _getExpr = function(type, key, value) {

      var v = _comparable(value);

      return {

        //k key
        k: key,

        //v value
        v: _prepare[type] ? _prepare[type](v) : v,

        //e eval
        e: _testers[type]
      };

    }

  })();


  var getSelector = function(selector) {

    if(!selector) {

      return function(value) {
        return value;
      };

    } else
    if(typeof selector == 'function') {
      return selector;
    }

    throw new Error("Unknown sift selector " + selector);
  }

  var sifter = function(query, selector) {

    //build the filter for the sifter
    var filter = _queryParser.parse(query);

    //the function used to sift through the given array
    var self = function(target) {

      var sifted = [], results = [], testValue, value, priority;

      //I'll typically start from the end, but in this case we need to keep the order
      //of the array the same.
      for(var i = 0, n = target.length; i < n; i++) {

        value = target[i];
        testValue = selector(value);

        //priority = -1? it's not something we can use.
        if(!~(priority = filter.priority(testValue))) continue;

        sifted.push(value);
      }

      return sifted;
    }

    //set the test function incase the sifter isn't needed
    self.test   = filter.test;
    self.score  = filter.priority;
    self.query  = query;

    return self;
  }


  /**
   * sifts the given function
   * @param query the mongodb query
   * @param target the target array
   * @param rawSelector the selector for plucking data from the given target
   */

  var sift = function(query, target, rawSelector) {

    //must be an array
    if(typeof target != "object") {
      rawSelector = target;
      target = void 0;
    }


    var sft  = sifter(query, getSelector(rawSelector));

    //target given? sift through it and return the filtered result
    if(target) return sft(target);

    //otherwise return the sifter func
    return sft;

  }


  sift.use = function(options) {
    if(options.operators) sift.useOperators(options.operators);
    if (typeof options === "function") options(sift);
  }

  sift.useOperators = function(operators) {
    for(var key in operators) {
      sift.useOperator(key, operators[key]);
    }
  }

  sift.useOperator = function(operator, optionsOrFn) {

    var options = {};

    if(typeof optionsOrFn == "object") {
      options = optionsOrFn;
    } else {
      options = { test: optionsOrFn };
    }


    var key = "$" + operator;
    _queryParser.testers[key] = options.test;

    if(options.traversable || options.traverse) {
      _queryParser.traversable[key] = true;
    }
  }


  //node.js?
  if((typeof module != 'undefined') && (typeof module.exports != 'undefined')) {
    module.exports = sift;
  } else

  //browser?
  if(typeof window != 'undefined') {
    window.sift = sift;
  }

})();


},{}],65:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[2])(2)
});