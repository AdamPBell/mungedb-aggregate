var TextMatchExpression = require("./TextMatchExpression"),
	ErrorCodes = require("../../Errors").ErrorCodes;

/**
 * Expression parser's text callback function.
 *
 * @param queryObj
 * @returns {*}
 * @private
 */
var _expressionParserTextCallbackReal = function _expressionParserTextCallbackReal(queryObj) {
	if (queryObj.$search._type !== "string") {
		return {code: ErrorCodes.BadValue, description: "$search needs a String"};
	}

	var language = "",
		languageElt = queryObj.$language;
	if (languageElt !== null) {
		if (typeof languageElt !== "string")
			return {code:ErrorCodes.BadValue, description:"$language needs a String"};
		language = languageElt;
		//TODO: finish implementing one day, just trying to fix jshint errors right now
	}
	var query = queryObj.$search;

	if (Object.keys(queryObj).length !== (languageElt === null ? 1 : 2)) {
		return {code:ErrorCodes.BadValue, description:"extra fields in $text"};
	}

	var e = new TextMatchExpression(),
		s = e.init(query, language);

	if (s.code !== ErrorCodes.OK) {
		return s;
	}

	return e;
};

module.exports = {
	expressionParserTextCallbackReal: _expressionParserTextCallbackReal
};
