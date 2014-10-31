"use strict";
var assert = require("assert"),
	RegexMatchExpression = require("../../../../lib/pipeline/matcher/RegexMatchExpression"),
	MatchDetails = require("../../../../lib/pipeline/matcher/MatchDetails");


module.exports = {
	"RegexMatchExpression": {



	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
