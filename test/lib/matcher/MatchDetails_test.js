"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	MatchDetails = require("../../../lib/matcher/MatchDetails");

exports.MatchDetails = {

	"Constructor": function Constructor() {
		var md = new MatchDetails();
		assert.equal(md._elemMatchKeyRequested, false);
		assert.equal(md._loadedRecord, false);
		assert.equal(md._elemMatchKey, undefined);
		assert(md instanceof MatchDetails);
	},

	"ResetOutput": function ResetOutput() {
		var md = new MatchDetails();
		md.setLoadedRecord(1);
		assert.equal(md._loadedRecord, 1);
		md.resetOutput();
		assert.equal(md._loadedRecord, 0);
		assert.equal(md._elemMatchKey, undefined);
	},

	"toString": function toString() {
		var md = new MatchDetails();
		assert(typeof md.toString() === "string");
	},

	"setLoadedRecord": function setLoadedRecord() {
		var md = new MatchDetails(),
			rec = {"TEST":1};
		md.setLoadedRecord(rec);
		assert.deepEqual(md._loadedRecord, rec);
	},

	"hasLoadedRecord": function hasLoadedRecord() {
		var md = new MatchDetails(),
			rec = true;
		md.setLoadedRecord(rec);
		assert.equal(md.hasLoadedRecord(), true);
	},

	"requestElemMatchKey": function requestElemMatchKey() {
		var md = new MatchDetails();
		md.requestElemMatchKey();
		assert(md.needRecord, true);	//should be true after request
	},

	"setElemMatchKey": function setElemMatchKey() {
		var md = new MatchDetails(),
			key = "TEST";
		md.setElemMatchKey(key);
		assert.equal(md.hasElemMatchKey(), false);	//should not be set unless requested
		md.requestElemMatchKey();
		md.setElemMatchKey(key);
		assert.equal(md.hasElemMatchKey(), true);
		assert.equal(md.elemMatchKey(), key);
	},

};
