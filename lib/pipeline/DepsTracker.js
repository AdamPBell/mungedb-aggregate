"use strict";

/**
 * Allows components in an aggregation pipeline to report what they need from their input.
 *
 * @class DepsTracker
 * @namespace mungedb-aggregate.pipeline
 * @module mungedb-aggregate
 * @constructor
 */
var DepsTracker = module.exports = function DepsTracker() {
	/* fields is a set of strings */
	this.fields = {};
	this.needWholeDocument = false;
	this.needTextScore = false;
}, klass = DepsTracker, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var ParsedDeps = require("./ParsedDeps");

/**
 * Returns a projection object covering the dependencies tracked by this class.
 *
 * @method toProjection
 * @return {Object} projection of caller's dependencies
 */
proto.toProjection = function toProjection() {
	var proj = {};

	// if(this.needTextScore) {
		// bb.append(Document::metaFieldTextScore, BSON("$meta" << "textScore"));
	// }

	if (this.needWholeDocument) {
		return proj;
	}

	if (Object.keys(this.fields).length === 0) {
		// Projection language lacks good a way to say no fields needed. This fakes it.
		proj._id = 0;
		proj.$noFieldsNeeded = 1;
		return proj;
	}

	var last = "",
		needId = false;

	Object.keys(this.fields).sort().forEach(function (it) {
		if (it.slice(0,3) == "_id" && (it.length == 3 || it.charAt(3) == ".")) {
			// _id and subfields are handled specially due in part to SERVER-7502
			needId = true;
			return;
		}

		if (last !== "" && it.slice(0, last.length) === last) {
			// we are including a parent of *it so we don't need to include this
			// field explicitly. In fact, due to SERVER-6527 if we included this
			// field, the parent wouldn't be fully included. This logic relies
			// on on set iterators going in lexicographic order so that a string
			// is always directly before of all fields it prefixes.
			return;
		}

		last = it + ".";
		proj[it] = 1;
	});

	if (needId)
		proj._id = 1;
	else
		proj._id = 0;

	return proj;
};

/**
 * Takes a depsTracker and builds a simple recursive lookup table out of it.
 *
 * @method toParsedDeps
 * @return {ParsedDeps}
 */
proto.toParsedDeps = function toParsedDeps() {
	var doc = {};

	if(this.needWholeDocument || this.needTextScore) {
		// can't use ParsedDeps in this case
		// TODO: not sure what appropriate equivalent to boost::none is
		return;
	}

	var last = "";
	Object.keys(this.fields).sort().forEach(function (it) {
		if (last !== "" && it.slice(0, last.length) === last) {
			// we are including a parent of *it so we don't need to include this
			// field explicitly. In fact, due to SERVER-6527 if we included this
			// field, the parent wouldn't be fully included. This logic relies
			// on on set iterators going in lexicographic order so that a string
			// is always directly before of all fields it prefixes.
			return;
		}

		last = it + ".";
		// TODO: set nested field to true; i.e. a.b.c = true, not a = true
		doc[it] = true;
	});

	return new ParsedDeps(doc);
};
