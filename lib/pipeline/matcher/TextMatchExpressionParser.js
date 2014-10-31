/**
 * Expression parser's text callback function.
 *
 * @param queryObj
 * @returns {*}
 * @private
 */
var _expressionParserTextCallbackReal = function _expressionParserTextCallbackReal(queryObj) {
	if (queryObj.$search._type !== 'string') {
		return {code: ErrorCodes.BadValue, description: '$search needs a String'};
	}

	var e = new TextMatchExpression(),
		s = e.init(query, language);

	if (s.code !== 'OK') {
		return s;
	}

	return e.release();
}

module.exports = {
	expressionParserTextCallbackReal: _expressionParserTextCallbackReal
};
