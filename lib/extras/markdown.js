"use strict";
//=============================================================================
// Exports a getMarkdown() and patches pipeline parts with a getMarkdown()
//=============================================================================
var pipeline = require("../pipeline"),
	matcher = require("../matcher");


var MAX_LINE_LEN = 140,
	INDENT_STR = "    ";

function getIndentStr(level) {
	var indent = "";
	while (level-- > 0) {
		indent += INDENT_STR;
	}
	return indent;
}

function getSingleLineJsonStr(obj){
	return JSON.stringify(obj, 0, 1)
		.replace(/\n\s*/g, " ");
}

function getMultiLineJsonStr(obj) {
	return JSON.stringify(obj, 0, 4);
}

function toListItem(str, i) {
	return str.replace(/(^\s*)/, "$&" + (i || 0) + ". ");
}

(function patchMatcher(matcher) {

	//NOTE: this area especially needs finished

	// base implementation for matcher MatchExpression instances; just calls `#debugString()`
	matcher.MatchExpression.prototype.getMarkdown = function(level) {
		return this.debugString(level);
	};

	matcher.ComparisonMatchExpression.prototype.getMarkdown = function(level) {
		var retStr = this._debugAddSpace(level) + "`" + this.path() + "` ";
		switch (this._matchType) {
			case "LT": retStr += "$lt"; break;
			case "LTE": retStr += "$lte"; break;
			case "EQ": retStr += "=="; break;
			case "GT": retStr += "$gt"; break;
			case "GTE": retStr += "$gte"; break;
			default: throw new Error("Unknown comparison!");
		}
		retStr += " " + (this._rhs !== undefined ? "`" + JSON.stringify(this._rhs) + "`" : "?");
		if (this.getTag()) {
			retStr += this.getTag().debugString();
		}
		return retStr + "\n";
	};

	matcher.ListOfMatchExpression.prototype.getMarkdown = function(level) {
		var str = this._debugAddSpace(level);
		switch (this._matchType) {
			case "AND": str += "all of:\n"; break;
			case "OR": str += "one of:\n"; break;
			case "NOR": str += "none of:\n"; break;
			case "NOT": str += "not all of:\n"; break;
			default: throw new Error("Unknown match type!");
		}
		var exps = this._expressions;
		if (exps.length === 0 && this._exp) exps = [this._exp];
		for (var i = 0; i < exps.length; i++) {
			str += toListItem(exps[i].getMarkdown(level + 1), i);
		}
		return str;
	};

	matcher.ExistsMatchExpression.prototype.getMarkdown = function(level) {
		return this._debugAddSpace(level) +
			"`" + this.path() + "` exists" +
			(this.getTag() ? " " + this.getTag().debugString() : "") +
			"\n";
	};

	matcher.InMatchExpression.prototype.getMarkdown = function(level) {
		return this._debugAddSpace(level) +
			"`" + this.path() + "` in " +
			"`" + this._arrayEntries.debugString(level) + "`" +
			(this.getTag() ? this.getTag().debugString() : "") +
			"\n";
	};

})(matcher);

(function patchPipeline(pipeline) {


	// (function patchPipelineAccumulators(accumulators) {
	//   // done in the $group handler for now
	// })(pipeline.accumulators);


	(function patchPipelineDocumentSources(documentSources) {

		//TODO: GeoNearDocumentSource

		//TODO: test single value for `_id` like `null` or `"$foo.bar.path"`
		documentSources.GroupDocumentSource.prototype.getMarkdown = function(level) {
			var i, l;
			var indent = getIndentStr(level),
				str = indent + "group docs into buckets:\n";
			if (this.idFieldNames.length === 0) {
				str += indent + INDENT_STR + "0. by `_id` which is from " + this.idExpressions[0].getMarkdown(0);
			} else {
				str += indent + INDENT_STR + "0. by `_id` which is from:\n";
				for (i = 0, l = this.idExpressions.length; i < l; i++) {
					var idKey = this.idFieldNames[i],
						idExp = this.idExpressions[i];
					str += indent + INDENT_STR + INDENT_STR + i + ". `" + idKey + "` from";
					var idExpStr = idExp.getMarkdown(level + 3).trimRight(),
						idExpStrLines = idExpStr.split("\n");
					if (idExpStrLines.length === 1) {
						str += " " + idExpStr.trimLeft() + "\n";
					} else {
						str += toListItem(idExp.getMarkdown(level + 3), i);
					}
				}
			}
			if (this.fieldNames.length > 0) {
				str += indent + INDENT_STR + "1. for each bucket keep:\n";
				for (i = 0, l = this.fieldNames.length; i < l; i++) {
					var key = this.fieldNames[i],
						acc = this.accumulatorFactories[i](),
						accName = acc.getOpName().replace(/^\$/, ""),
						accNameAliases = {
							addToSet: "unique set",
							push: "array",
						},
						exp = this.expressions[i];
					str += indent + INDENT_STR + INDENT_STR + i + ". `" + key + "` as " + (accNameAliases[accName] || accName) + " of";
					if (!exp.expressions) {
						str += " " + exp.getMarkdown(level + 2).trimLeft();
					} else {
						str += "\n" + toListItem(exp.getMarkdown(level + 3));
					}
				}
			}
			return str;
		};

		documentSources.LimitDocumentSource.prototype.getMarkdown = function(level) {
			return getIndentStr(level) + "limit to only `" + this.limit + "` output docs";
		};

		documentSources.MatchDocumentSource.prototype.getMarkdown = function(level) {
			var str = "",
				indent = getIndentStr(level),
				exp = this.matcher._expression;
			str += indent + "find docs matching:\n";
			if (exp.expressions) {
				str += exp.getMarkdown(level + 1);
			} else {
				str += indent + INDENT_STR + "0. " + exp.getMarkdown(level + 1).trimLeft();
			}
			return str;
		};

		//TODO: OutDocumentSource

		documentSources.ProjectDocumentSource.prototype.getMarkdown = function(level) {
			return "for each doc " + this.OE.getMarkdown(level);

		};

		//TODO: RedaactDocumentSource

		documentSources.SkipDocumentSource.prototype.getMarkdown = function(level) {
			return getIndentStr(level) + "skip the next `" + this.limit + "` output docs";
		};

		documentSources.SortDocumentSource.prototype.getMarkdown = function(level) {
			var indent = getIndentStr(level),
				str = indent + "sort docs by:\n";
			for (var i = 0, l = this.vSortKey.length; i < l; i++) {
				var orderStr = this.vAscending[i] ? "in order" : "in reverse order";
				str += indent + INDENT_STR + i + ". " + this.vSortKey[i].getMarkdown().trimRight() + ", " + orderStr;
			}
			return str;
		};

		documentSources.UnwindDocumentSource.prototype.getMarkdown = function(level) {
			return getIndentStr(level) + "unwind docs by using each item in `" +
				this._unwindPath.getPath(false) + "` to create a copy that has the list item rather than the list";
		};

	})(pipeline.documentSources);


	(function patchPipelineExpressions(expressions) {

		// base implementation for expression Expression instances; just calls `#serialize()`
		expressions.Expression.prototype.getMarkdown = function(level) {
			var obj = this.serialize(),
				objStr = typeof obj === "string" ? obj : getSingleLineJsonStr(obj);
			return getIndentStr(level) + "`" + objStr + "`\n";
		};

		expressions.AddExpression.prototype.getMarkdown = function(level) {
			var str = "",
				indent = getIndentStr(level),
				opStrs = this.operands.map(function(op) {
					return op.getMarkdown(level + 1).trimRight();
				}),
				isOneLine = opStrs.length <= 2 && opStrs.every(function(opStr, i) {
					return opStr.indexOf("\n") === -1;
				});
			if (isOneLine && indent.length + opStrs.join(" + ").length < MAX_LINE_LEN) {
				str += indent + "( " + opStrs.map(Function.prototype.call.bind(String.prototype.trimLeft)).join(" + ") + " )\n";
			} else {
				str += indent + "add:\n";
				for (var i = 0, l = this.operands.length; i < l; i++) {
					str += toListItem(opStrs[i], i) + "\n";
				}
			}
			return str;
		};

		//TODO: $allElementsTrue

		expressions.AndExpression.prototype.getMarkdown = function(level) {
			var str = getIndentStr(level) + "all of:\n",
				ops = this.operands;
			for (var i = 0; i < ops.length; i++) {
				var opStr = ops[i].getMarkdown(level + 1).trimRight();
				str += toListItem(opStr, i) + "\n";
			}
			return str;
		};

		//TODO: $anyElementTrue

		//TODO: $coerceToBool

		expressions.CompareExpression.prototype.getMarkdown = function(level) {
			var str = "",
				indent = getIndentStr(level),
				opStrs = this.operands.map(function(op) {
					return op.getMarkdown(level + 1).trimRight();
				}),
				isOneLine = opStrs.length <= 2 && opStrs.every(function(opStr, i) {
					return opStr.indexOf("\n") === -1;
				});
			if (isOneLine && indent.length + opStrs.join("").length < MAX_LINE_LEN) {
				var cmpOpAliases = {
						$eq: "==",
						$ne: "!=",
					},
					cmpOpAlias = cmpOpAliases[this.cmpOp],
					cmpOpStr = cmpOpAlias ? cmpOpAlias : "`" + this.cmpOp + "`";
				if (opStrs.length === 1) str += indent + cmpOpStr + " " + opStrs[0].trim() + "\n";
				else str += indent + opStrs[0].trim() + " " + cmpOpStr + " " + opStrs[1].trim() + "\n";
			} else {
				str += indent + "is `" + this.cmpOp + "`\n";
				for (var i = 0, l = this.operands.length; i < l; i++) {
					str += toListItem(opStrs[i], i) + "\n";
				}
			}
			return str;
		};

		expressions.ConcatExpression.prototype.getMarkdown = function(level) {
			var str = getIndentStr(level) + "concatenate:\n",
				ops = this.operands;
			for (var i = 0; i < ops.length; i++) {
				var opStr = ops[i].getMarkdown(level + 1).trimRight();
				str += toListItem(opStr, i) + "\n";
			}
			return str;
		};

		expressions.CondExpression.prototype.getMarkdown = function(level) {
			var indent = getIndentStr(level),
				str = indent + "conditional:\n";
			var names = ["if", "then", "else"];
			names.forEach(function(name, i) {
				str += indent + INDENT_STR + i + ". " + name;
				var opDocStr = this.operands[i].getMarkdown(level + 2).trimRight();
				if (opDocStr.indexOf("\n") === -1 && opDocStr.length < MAX_LINE_LEN) { // is one line
					str += " " + opDocStr.trimLeft() + "\n";
				} else {
					str += ":\n" + toListItem(opDocStr) + "\n";
				}
			}, this);
			return str;
		};

		expressions.ConstantExpression.prototype.getMarkdown = function(level) {
			return getIndentStr(level) + "the constant `" + JSON.stringify(this.value) + "`\n";
		};

		//TODO: $dayOfMonth

		//TODO: $dayOfWeek

		//TODO: $dayOfYear

		expressions.DivideExpression.prototype.getMarkdown = function(level) {
			var indent = getIndentStr(level),
				str = indent + "divide:\n";
			var names = ["numerator", "denominator"];
			names.forEach(function(name, i) {
				str += indent + INDENT_STR + i + ". " + name;
				var opDocStr = this.operands[i].getMarkdown(level + 2).trimRight();
				if (opDocStr.indexOf("\n") === -1 && opDocStr.length < MAX_LINE_LEN) { // is one line
					str += " is " + opDocStr.trimLeft() + "\n";
				} else {
					str += ":\n" + toListItem(opDocStr) + "\n";
				}
			}, this);
			return str;
		};

		expressions.FieldPathExpression.prototype.getMarkdown = function(level) {
			var str = "",
				indent = getIndentStr(level),
				fp = this._fieldPath;
			if ((fp.fieldNames[0] === "CURRENT" || fp.fieldNames[0] === "ROOT") && fp.fieldNames.length > 1) {
				str += fp.tail().getPath(false);
			} else {
				str += "$$" + fp.getPath(false);
			}
			return indent + "`" + str + "`\n";
		};

		//TODO: $hour

		expressions.IfNullExpression.prototype.getMarkdown = function(level) {
			var str = getIndentStr(level);
			var opExpDocStr = this.operands[0].getMarkdown(0).trimRight(),
				opOtherExpDocStr = this.operands[1].getMarkdown(level).trimRight();
			str += opExpDocStr + " if not null or fallback to " + opOtherExpDocStr.trimLeft();
			if (opExpDocStr.indexOf("\n") !== -1) throw new Error("TODO: fix multiline $ifNull output");
			str += "\n";
			return str;
		};

		//TODO: $let

		//TODO: $map

		//TODO: $millisecond

		//TODO: $minute

		expressions.ModExpression.prototype.getMarkdown = function(level) {
			var indent = getIndentStr(level),
				str = indent + "get remainder of (modulo):\n";
			var names = ["numerator", "denominator"];
			names.forEach(function(name, i) {
				str += indent + INDENT_STR + i + ". " + name;
				var opDocStr = this.operands[i].getMarkdown(level + 2).trimRight();
				if (opDocStr.indexOf("\n") === -1 && opDocStr.length < MAX_LINE_LEN) { // is one line
					str += " is " + opDocStr.trimLeft() + "\n";
				} else {
					str += ":\n" + toListItem(opDocStr) + "\n";
				}
			}, this);
			return str;
		};

		//TODO: $month

		expressions.MultiplyExpression.prototype.getMarkdown = function(level) {
			var str = "",
				indent = getIndentStr(level),
				opStrs = this.operands.map(function(op) {
					return op.getMarkdown(level + 1).trimRight();
				}),
				isOneLine = opStrs.length <= 2 && opStrs.every(function(opStr, i) {
					return opStr.indexOf("\n") === -1;
				});
			if (isOneLine && indent.length + opStrs.join(" + ").length < MAX_LINE_LEN) {
				str += indent + "( " + opStrs.map(Function.prototype.call.bind(String.prototype.trimLeft)).join(" + ") + " )\n";
			} else {
				str += indent + "multiply:\n";
				for (var i = 0, l = this.operands.length; i < l; i++) {
					str += toListItem(opStrs[i], i) + "\n";
				}
			}
			return str;
		};

		expressions.NotExpression.prototype.getMarkdown = function(level) {
			var indent = getIndentStr(level),
				str = indent + "not:\n";
			str += toListItem(this.operands[0].getMarkdown(level + 1));
			return str;
		};

		expressions.ObjectExpression.prototype.getMarkdown = function(level) {
			var indent = getIndentStr(level),
				exps = this._expressions,
				keys = this._order;
			if (!this.excludeId && keys.indexOf("_id") === -1) keys.unshift("_id");
			if (keys.length === 0) return indent + "empty object\n";
			var str = indent + "build object:\n";
			for (var i = 0, l = keys.length; i < l; i++) {
				var key = keys[i],
					exp = exps[key];
				str += indent + INDENT_STR + i + ". `" + key + "` from";
				if (exp) {
					var expStr = exp.getMarkdown(level + 2).trimRight();
					if (expStr.indexOf("\n") === -1) { // is one line
						str += " " + expStr.trimLeft() + "\n";
					} else {
						str += "\n" + toListItem(expStr) + "\n";
					}
				} else {
					str += " `" + key + "` (unchanged)\n";
				}
			}
			return str;
		};

		expressions.OrExpression.prototype.getMarkdown = function(level) {
			var str = getIndentStr(level) + "one of:\n",
				ops = this.operands;
			for (var i = 0; i < ops.length; i++) {
				var opStr = ops[i].getMarkdown(level + 1).trimRight();
				str += toListItem(opStr, i) + "\n";
			}
			return str;
		};

		//TODO: $second

		//TODO: $setDifference

		//TODO: $setEquals

		//TODO: $setIntersection

		//TODO: $setIsSubset

		//TODO: $setUnion

		//TODO: $size

		//TODO: $strcasecmp

		expressions.SubstrExpression.prototype.getMarkdown = function(level) {
			var str = "",
				indent = getIndentStr(level);
			str += indent + "a substring";

			var opStringDocStr = this.operands[0].getMarkdown(0).trimRight();
			str += " from " + opStringDocStr.trimLeft();

			var opStartDocStr = this.operands[1].getMarkdown(0).trimRight();
			str += ", starting position is at " + opStartDocStr.trimLeft();

			var opLengthDocStr = this.operands[2].getMarkdown(0).trimRight();
			str += ", length is " + opLengthDocStr.trimLeft();

			if (str.indexOf("\n") !== -1) throw new Error("TODO: fix multiline $substr output");
			str += "\n";
			return str;
		};

		expressions.SubtractExpression.prototype.getMarkdown = function(level) {
			var indent = getIndentStr(level),
				str = indent + "subtract:\n";
			var names = ["minuend", "subtrahend"];
			names.forEach(function(name, i) {
				str += indent + INDENT_STR + i + ". " + name;
				var opDocStr = this.operands[i].getMarkdown(level + 2).trimRight();
				if (opDocStr.indexOf("\n") === -1 && opDocStr.length < MAX_LINE_LEN) { // is one line
					str += " is " + opDocStr.trimLeft() + "\n";
				} else {
					str += ":\n" + toListItem(opDocStr) + "\n";
				}
			}, this);
			return str;
		};

		//TODO: $toLower

		//TODO: $toUpper

		//TODO: $week

		//TODO: $year

	})(pipeline.expressions);


})(pipeline);


module.exports = {
	INDENT_STR: INDENT_STR,
	getIndentStr: getIndentStr,
	getSingleLineJsonStr: getSingleLineJsonStr,
	getMultiLineJsonStr: getMultiLineJsonStr,
	toListItem: toListItem,
	getMarkdown: function getMarkdown(pipelineJson) {
		var out = "",
			docSrcs = pipelineJson;
		if (!(docSrcs[0] instanceof pipeline.documentSources.DocumentSource)) {
			docSrcs = pipeline.Pipeline.parseDocumentSources(pipelineJson, {});
		}
		for (var i = 0, l = docSrcs.length; i < l; i++) {
			var docSrc = docSrcs[i];
			out += i + ". " + docSrc.getMarkdown(0).trimRight() + "\n";
		}
		return out;
	},
};
