"use strict";

var utils = module.exports = {

	/**
	 * Convert BSONObj to a BSONObj with our $const wrappings.
	 * @method constify
	 */
	constify: function constify(obj, parentIsArray) {
		if (parentIsArray === undefined) parentIsArray = false;
		var bob = parentIsArray ? [] : {};
		for (var key in obj) {
			if (!obj.hasOwnProperty(key)) continue;
			var elem = obj[key];
			if (elem instanceof Object && elem.constructor === Object) {
				bob[key] = utils.constify(elem, false);
			} else if (Array.isArray(elem) && !parentIsArray) {
				// arrays within arrays are treated as constant values by the real parser
				bob[key] = utils.constify(elem, true);
			} else if (key == "$const" ||
					(typeof elem == "string" && elem[0] == "$")) {
				bob[key] = obj[key];
			} else {
				bob[key] = {$const: obj[key]};
			}
		}
		return bob;
	},

	//SKIPPED: assertBinaryEqual

	//SKIPPED: toJson

	/**
	 * Convert Expression to BSON.
	 * @method expressionToJson
	 */
	expressionToJson: function expressionToJson(expr) {
		return expr.serialize(false);
	},

	//SKIPPED: fromJson

	//SKIPPED: valueFromJson

};
