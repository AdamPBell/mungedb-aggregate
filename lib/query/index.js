"use strict";

var DocumentSource = require("../pipeline/documentSources/DocumentSource"),
	Runner = require("./Runner"),
	ArrayRunner = require("./ArrayRunner"),
	DocumentSourceRunner = require("./DocumentSourceRunner");

module.exports = {
	Runner: Runner,
	ArrayRunner: ArrayRunner,
	DocumentSourceRunner: DocumentSourceRunner,
	getRunner: function(data, queryObj, sortObj, projectionForQuery, sources){
		if (data && data.constructor === Array){
			return new ArrayRunner(data);
		} else if (data && data instanceof DocumentSource){
			return new DocumentSourceRunner(data, sources);
		} else {
			throw new Error("could not construct Runner from given data");
		}
	}
};
