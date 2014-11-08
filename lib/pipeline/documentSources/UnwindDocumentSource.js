"use strict";

var async = require('async'),
	DocumentSource = require('./DocumentSource'),
	Expression = require('../expressions/Expression'),
	FieldPath = require('../FieldPath'),
	Value = require('../Value'),
	Document = require('../Document');

/**
 * A document source unwinder
 * @class UnwindDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [ctx] {ExpressionContext}
 **/
var UnwindDocumentSource = module.exports = function UnwindDocumentSource(ctx){
	if (arguments.length > 1) {
		throw new Error('Up to one argument expected.');
	}

	base.call(this, ctx);

	this._unwindPath = null; // Configuration state.
	this._unwinder = null; // Iteration state.
}, klass = UnwindDocumentSource, base = require('./DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.unwindName = '$unwind';

klass.Unwinder = (function() {
	/**
	 * Construct a new Unwinder instance. Used as a parent class for UnwindDocumentSource.
	 *
	 * @param unwindPath
	 * @constructor
	 */
	var klass = function Unwinder(unwindPath) {
		this._unwindPath = new FieldPath(unwindPath);

		this._inputArray = undefined;
		this._document = undefined;
		this._index = undefined;
	}, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor: {value: klass}});

	proto.resetDocument = function resetDocument(document) {
		if (!document) throw new Error('Document is required!');

		this._inputArray = [];
		this._document = document;
		this._index = 0;

		var pathValue = Document.getNestedField(this._document, this._unwindPath);

		if (!pathValue || pathValue.length === 0) {
			return;
		}

		if (!(pathValue instanceof Array)) {
			throw new Error(UnwindDocumentSource.unwindName + ':  value at end of field path must be an array; code 15978');
		}

		this._inputArray = pathValue;
	};

	/**
	 * getNext
	 *
	 * This is just wrapping the old functions because they are somewhat different
	 * than the original mongo implementation, but should get updated to follow the current API.
	 **/
	proto.getNext = function getNext() {
		if (this._inputArray === undefined || this._index === this._inputArray.length) {
			return null;
		}

		this._document = Document.cloneDeep(this._document);
		Document.setNestedField(this._document, this._unwindPath, this._inputArray[this._index++]);

		return this._document;
	};

	return klass;
})();

/**
 * Get the document source name.
 *
 * @method getSourceName
 * @returns {string}
 */
proto.getSourceName = function getSourceName() {
	return klass.unwindName;
};

/**
 * Get the next source.
 *
 * @method getNext
 * @param callback
 * @returns {*}
 */
proto.getNext = function getNext(callback) {
	if (!callback) {
		throw new Error(this.getSourceName() + ' #getNext() requires callback.');
	}

	if (this.expCtx.checkForInterrupt && this.expCtx.checkForInterrupt() === false) {
		return callback(new Error('Interrupted'));
	}

	var self = this,
		out,
		exhausted = false;

	try {
		out = this._unwinder.getNext();
	} catch (ex) {
		return callback(ex);
	}

	async.until(
		function () {
			if (out !== null || exhausted) {
				return true;
			}

			return false;
		},
		function (cb) {
			self.source.getNext(function (err, doc) {
				if (err) {
					return cb(err);
				}

				try {
					if (doc === null) {
						exhausted = true;
					} else {
						self._unwinder.resetDocument(doc);
						out = self._unwinder.getNext();
					}
				} catch (ex) {
					return cb(ex);
				}

				return cb();
			});
		},
		function(err) {
			if (err) {
				return callback(err);
			}

			return callback(null, out);
		}
	);

	return out;
};

/**
 * Serialize the data.
 *
 * @method serialize
 * @param explain
 * @returns {{}}
 */
proto.serialize = function serialize(explain) {
	if (!this._unwindPath) {
		throw new Error('unwind path does not exist!');
	}

	var doc = {};

	doc[this.getSourceName()] = this._unwindPath.getPath(true);

	return doc;
};

/**
 * Get the fields this operation needs to do its job.
 *
 * @method getDependencies
 * @param deps
 * @returns {DocumentSource.GetDepsReturn.SEE_NEXT|*}
 */
proto.getDependencies = function getDependencies(deps) {
	if (!this._unwindPath) {
		throw new Error('unwind path does not exist!');
	}

	deps.fields[this._unwindPath.getPath(false)] = 1;

	return DocumentSource.GetDepsReturn.SEE_NEXT;
};

/**
 * Unwind path.
 *
 * @method unwindPath
 * @param fieldPath
 */
proto.unwindPath = function unwindPath(fieldPath) {
	if (this._unwindPath) {
		throw new Error(this.getSourceName() + ' can\'t unwind more than one path; code 15979');
	}

	// Record the unwind path.
	this._unwindPath = new FieldPath(fieldPath);
	this._unwinder = new klass.Unwinder(fieldPath);
};

/**
 * Creates a new UnwindDocumentSource with the input path as the path to unwind
 * @method createFromJson
 * @param {String} JsonElement this thing is *called* Json, but it expects a string
**/
klass.createFromJson = function createFromJson(jsonElement, ctx) {
	if (jsonElement.constructor !== String) {
		throw new Error('the ' + klass.unwindName + ' field path must be specified as a string; code 15981');
	}

	var pathString = Expression.removeFieldPrefix(jsonElement),
		unwind = new UnwindDocumentSource(ctx);

	unwind.unwindPath(pathString);

	return unwind;
};
