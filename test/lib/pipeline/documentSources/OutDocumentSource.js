"use strict";
var assert = require("assert"),
	async = require("async"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource"),
	OutDocumentSource = require("../../../../lib/pipeline/documentSources/OutDocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	Cursor = require("../../../../lib/Cursor");

var createOut = function(ctx) {
	var ds = new OutDocumentSource(ctx);
	return ds;
};

module.exports = {

	"OutDocumentSource": {

		"constructor()":{

			"should not throw when constructing without args":function() {
				assert.doesNotThrow(function(){
					var ods = createOut();
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

			"should act ass passthrough (for now)": function(next) {
				var ods = OutDocumentSource.createFromJson("test"),
					cwc = new CursorDocumentSource.CursorWithContext(),
					l = [{_id:0,a:[{b:1},{b:2}]}, {_id:1,a:[{b:1},{b:1}]} ];

				cwc._cursor = new Cursor( l );
				var cds = new CursorDocumentSource(cwc);
				ods.setSource(cds);

				var docs = [], i = 0;
				async.doWhilst(
					function(cb) {
						ods.getNext(function(err, val) {
							docs[i] = val;
							return cb(err);
						});
					},
					function() {
						return docs[i++] !== DocumentSource.EOF;
					},
					function(err) {
						assert.deepEqual([{_id:0,a:[{b:1},{b:2}]}, {_id:1,a:[{b:1},{b:1}]}, DocumentSource.EOF], docs);
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
				var cwc = new CursorDocumentSource.CursorWithContext();
				var input = [{_id: 0, a: 1}, {_id: 1, a: 2}];
				cwc._cursor = new Cursor( input );
				var cds = new CursorDocumentSource(cwc);
				var title = "CognitiveScientists";
				var ods = OutDocumentSource.createFromJson(title);
				ods.setSource(cds);
				var srcNm = ods.getSourceName();
				var serialize = {};
				serialize[srcNm] = title;

				assert.deepEqual(ods.serialize(), serialize);
			}
		}
	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).grep(process.env.MOCHA_GREP || '').run(process.exit);
