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
	// fields is a set of strings
	this.fields = {};
	this.needWholeDocument = false;
	this.needTextScore = false;
}, klass = DepsTracker, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

var ParsedDeps = require("./ParsedDeps"),
	Document = require("./Document");

/**
 * Returns a projection object covering the dependencies tracked by this class.
 * @method toProjection
 * @return {Object} projection of caller's dependencies
 */
proto.toProjection = function toProjection() {
	var proj = {};

	// if(this.needTextScore) {
	// 	bb.append(Document::metaFieldTextScore, BSON("$meta" << "textScore"));
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

	var needId = false,
		last = "";
	Object.keys(this.fields).sort().forEach(function(it) {
		if (it.indexOf("_id") === 0 && (it.length === 3 || it[3] === ".")) {
			// _id and subfields are handled specially due in part to SERVER-7502
			needId = true;
			return;
		}

		if (last !== "" && it.indexOf(last) === 0) {
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

	if (needId) // we are explicit either way
		proj._id = 1;
	else
		proj._id = 0;

	return proj;
};

// ParsedDeps::_fields is a simple recursive look-up table. For each field:
//      If the value has type==Bool, the whole field is needed
//      If the value has type==Object, the fields in the subobject are needed
//      All other fields should be missing which means not needed
/**
 * Takes a depsTracker and builds a simple recursive lookup table out of it.
 * @method toParsedDeps
 * @return {ParsedDeps}
 */
proto.toParsedDeps = function toParsedDeps() {
	var obj = {};

	if (this.needWholeDocument || this.needTextScore) {
		// can't use ParsedDeps in this case
		return undefined; // TODO: is this equivalent to boost::none ?
	}

	var last = "";
	Object.keys(this.fields).sort().forEach(function (it) {
		if (last !== "" && it.indexOf(last) === 0) {
			// we are including a parent of *it so we don't need to include this
			// field explicitly. In fact, due to SERVER-6527 if we included this
			// field, the parent wouldn't be fully included. This logic relies
			// on on set iterators going in lexicographic order so that a string
			// is always directly before of all fields it prefixes.
			return;
		}

		last = it + ".";
		Document.setNestedField(obj, it, true);
	});

	return new ParsedDeps(obj);
};
