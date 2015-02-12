"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	async = require("neo-async"),
	OutDocumentSource = require("../../../../lib/pipeline/documentSources/OutDocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	ArrayRunner = require("../../../../lib/query/ArrayRunner");

function createOut(ctx) {
	var ds = new OutDocumentSource(ctx);
	return ds;
}

function addSource(ds, data) {
	var cds = new CursorDocumentSource(null, new ArrayRunner(data), null);
	ds.setSource(cds);
}

module.exports = {

	"OutDocumentSource": {

		"constructor()":{

			"should not throw when constructing without args":function() {
				assert.doesNotThrow(function(){
					createOut();
				});
			}

		},

		"#getSourceName()":{

			"should return the correct source name; $out": function() {
				var ods = createOut();
				assert.strictEqual(ods.getSourceName(), "$out");
			}

		},

		"#getNext()":{

			"callback is required":function() {
				var ods = createOut();
				assert.throws(ods.getNext.bind(ods));
			},

			"should act as passthrough (for now)": function(next) {
				var ods = OutDocumentSource.createFromJson("test"),
					l = [{_id:0,a:[{b:1},{b:2}]}, {_id:1,a:[{b:1},{b:1}]} ];

				addSource(ods, l);

				var docs = [], i = 0;
				async.doWhilst(
					function(cb) {
						ods.getNext(function(err, val) {
							docs[i] = val;
							return cb(err);
						});
					},
					function() {
						return docs[i++] !== null;
					},
					function(err) {
						assert.deepEqual([{_id:0,a:[{b:1},{b:2}]}, {_id:1,a:[{b:1},{b:1}]}, null], docs);
						next();
					}
				);
			}
		},

		"#createFromJson()":{

			"method creates OutDocumentSource with given title":function() {
				var title = "CognitiveScientists",
					ods = OutDocumentSource.createFromJson(title);

				assert.strictEqual(title, ods._collectionName);
			}

		},

		"#serialize()":{

			"serialize":function() {
				var input = [{_id: 0, a: 1}, {_id: 1, a: 2}];
				var title = "CognitiveScientists";
				var ods = OutDocumentSource.createFromJson(title);
				addSource(ods, input);
				var srcNm = ods.getSourceName();
				var serialize = {};
				serialize[srcNm] = title;

				assert.deepEqual(ods.serialize(), serialize);
			}
		}
	}
};
