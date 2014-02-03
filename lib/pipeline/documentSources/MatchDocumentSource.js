"use strict";
var async = require("async"),
	matcher = require("../matcher/Matcher2.js"),
	DocumentSource = require("./DocumentSource");

/**
 * A match document source built off of DocumentSource
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
	this.matcher = new matcher(query);
}, klass = MatchDocumentSource, base = require('./DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.matchName = "$match";

proto.getSourceName = function getSourceName(){
	return klass.matchName;
};

proto.getNext = function getNext(callback) {
	if (!callback) return new Error(this.getSourceName() + ' #getNext() requires callback');

	var self = this,
		next;
	async.doWhilst(
		function(cb) {
			self.source.getNext(function(err, val) {
				next = val;

				if (self.matcher.matches(next))
					return cb(next);
				return cb();
			});
		},
		function() {
			return next !== DocumentSource.EOF;
		},
		function(doc) {
			if (!doc)
				return callback(null, DocumentSource.EOF);
			return callback(null, doc);
		}

	);
};

proto.coalesce = function coalesce(nextSource) {
	if (!(nextSource instanceof MatchDocumentSource))
		return false;

	this.matcher = new matcher({"$and": [this.getQuery(), nextSource.getQuery()]});

	return true;
};

proto.serialize = function(explain) {
	var out = {};
	out[this.getSourceName()] = this.getQuery();
	return out;
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

proto.getQuery = function getQuery() {
	return this.matcher._pattern;
};

/** Returns the portion of the match that can safely be promoted to before a $redact.
 *  If this returns an empty BSONObj, no part of this match may safely be promoted.
 *
 *  To be safe to promote, removing a field from a document to be matched must not cause
 *  that document to be accepted when it would otherwise be rejected. As an example,
 *  {name: {$ne: "bob smith"}} accepts documents without a name field, which means that
 *  running this filter before a redact that would remove the name field would leak
 *  information. On the other hand, {age: {$gt:5}} is ok because it doesn't accept documents
 *  that have had their age field removed.
 */
proto.redactSafePortion = function redactSafePortion() {
	var self = this;

	// This block contains the functions that make up the implementation of
	// DocumentSourceMatch::redactSafePortion(). They will only be called after
	// the Match expression has been successfully parsed so they can assume that
	// input is well formed.

	var isAllDigits = function(n) {
		return typeof n == 'number' && !isNaN(n - n);
	};

	var isFieldnameRedactSafe = function isFieldnameRedactSafe(field) {
		var dotPos = field.indexOf('.');
		if (dotPos === -1)
			return !isAllDigits(field);

		var part = field.slice(0, dotPos),
			rest = field.slice(dotPos+1, field.length);

		return !isAllDigits(part) && isFieldnameRedactSafe(rest);
	};

	// Returns the redact-safe portion of an "inner" match expression. This is the layer like
    // {$gt: 5} which does not include the field name. Returns an empty document if none of the
    // expression can safely be promoted in front of a $redact.
	var redactSavePortionDollarOps = function redactSafePortionDollarOps(expr) {
		var output = {},
			elem,i,j,k;

		var keys = Object.keys(expr);
		for (i = 0; i < keys.length; i++) {
			var field = keys[i],
				value = expr[field];

			if (field[0] !== '$')
				continue;

			// Ripped the case apart and did not implement this painful thing:
			// https://github.com/mongodb/mongo/blob/r2.5.4/src/mongo/db/jsobj.cpp#L286
			// Somebody should be taken to task for that work of art.
			if (field === '$type' || field === '$regex' || field === '$options' || field === '$mod') {
				output[field] = value;
			} else if (field === '$lte' || field === '$gte' || field === '$lt' || field === '$gt') {
				if (isTypeRedactSaveInComparison(field))
					output[field] = value;
			} else if (field === '$in') {
				// TODO: value/elem/field/etc may be mixed up and wrong here
				var allOk = true;
				for (j = 0; j < Object.keys(value); j++) {
					elem = Object.keys(value)[j];
					if (!isTypeRedactSaveInComparison(elem)) {
						allOk = false;
						break;
					}
				}
				if (allOk) {
					output[field] = value;
				}
				break;
			} else if (field === '$all') {
				// TODO: value/elem/field/etc may be mixed up and wrong here
				var matches = [];
				for (j = 0; j < field.length; j++) {
					elem = Object.keys(value)[j];
					if (isTypeRedactSaveInComparison(elem))
						matches.push(value[elem]);
				}
				if (matches.length)
					output[field] = matches;

			} else if (field === '$elemMatch') {
				var subIn = field,
					subOut;

				if (subIn[0] === '$')
					subOut = redactSafePortionDollarOps(subIn);
				else
					subOut = redactSafePortionTopLevel(subIn);

				if (subOut)
					output[field] = subOut;

				break;
			} else {
				// never allowed:
				// equality, maxDist, near, ne, opSize, nin, exists, within, geoIntersects
				continue;
			}
		}

		return output;
	};

	var isTypeRedactSaveInComparison = function isTypeRedactSaveInComparison(type) {
		if (type instanceof Array || type instanceof Object || type === null || type === undefined)
			return false;
		return true;
	};

	// Returns the redact-safe portion of an "outer" match expression. This is the layer like
	// {fieldName: {...}} which does include the field name. Returns an empty document if none of
	// the expression can safely be promoted in front of a $redact.
	var redactSafePortionTopLevel = function(topQuery) {
		var output = {},
			okClauses = [],
			keys = Object.keys(query),
			j, elm, clause;

		for (var i = 0; i < keys.length; i++) {
			var field = keys[i],
				query = topQuery[field];

			if (field.length && field[0] === '$') {
				if (field === '$or') {
					okClauses = [];
					for (j = 0; j < Object.keys(field).length; j++) {
						elm = field[Object.keys(field)[j]];
						clause = redactSafePortionTopLevel(elm);

						if (!clause) {
							okClauses = [];
							break;
						}

						okClauses.push(clause);
					}

					if (okClauses) {
						output.$or = okClauses;
					}
				} else if (field === '$and') {
					okClauses = [];
					for (j = 0; j < Object.keys(field).length; j++) {
						elm = field[Object.keys(field)[j]];
						clause = redactSafePortionTopLevel(elm);

						if (clause)
							okClauses.push(clause);
					}

					if (okClauses.length)
						output.$and = okClauses;
				}

				continue;
			}

			if (!isFieldnameRedactSafe(field))
					continue;

			if (field instanceof Array || !field) {
				continue;
			} else {
				// subobjects
				var sub = redactSavePortionDollarOps(field);
				if (sub)
					output[field] = sub;

				break;
			}
		}

		return output;
	};

	return redactSafePortionTopLevel(this.getQuery());
};
