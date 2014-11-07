"use strict";

var DocumentSource = require('../pipeline/documentSources/DocumentSource'),
	Runner = require("./Runner.js"),
	ArrayRunner = require("./ArrayRunner.js"),
	DocumentSourceRunner = require("./DocumentSourceRunner.js");

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
			throw new Error('could not construct Runner from given data');
		}
	}
};
