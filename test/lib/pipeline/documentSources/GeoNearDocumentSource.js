"use strict";
var assert = require("assert"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource"),
	GeoNearDocumentSource = require("../../../../lib/pipeline/documentSources/GeoNearDocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	Cursor = require("../../../../lib/Cursor"),
	FieldPath = require("../../../../lib/pipeline/FieldPath");

var createGeoNear = function(ctx) {
	var ds = new GeoNearDocumentSource(ctx);
	return ds;
};

module.exports = {

	"GeoNearDocumentSource": {

		"constructor()":{

			"should not throw when constructing without args":function() {
				assert.doesNotThrow(function(){
					var gnds = createGeoNear();
				});
			},

			"check defaults":function() {
				var gnds = createGeoNear();
				assert.equal(gnds.coordsIsArray, false);
				assert.equal(gnds.limit, 100);
				assert.equal(gnds.maxDistance, -1.0);
				assert.equal(gnds.spherical, false);
				assert.equal(gnds.distanceMultiplier, 1.0);
				assert.equal(gnds.uniqueDocs, true);
			}

		},

		"#getSourceName()":{

			"should return the correct source name; $geoNear": function() {
				var gnds = createGeoNear();
				assert.strictEqual(gnds.getSourceName(), "$geoNear");
			}

		},

		"#getNext()":{

			"callback is required":function() {
				var gnds = createGeoNear();
				assert.throws(gnds.getNext.bind(gnds));
			}
		},

		"#setSource()":{

			"check that setting source of GeoNearDocumentSource throws error":function() {
				var cwc = new CursorDocumentSource.CursorWithContext();
				var input = [{}];
				cwc._cursor = new Cursor( input );
				var cds = new CursorDocumentSource(cwc);
				var gnds = createGeoNear();

				assert.throws(function(){
					gnds.setSource(cds);
				});
			}

		},

		"#createFromJson()":{

			"method creates GeoNearDocumentSource with appropriate options":function() {
				var optsObj = {
						// example options
						near:[40.724, -73.997],
						limit:25,
						query:{type:'public'},
						distanceField: "dist.calculated",
						maxDistance:0.8,
						uniqueDocs:true,
						includeLocs:"dist.location"
					},
					optsStr = JSON.stringify(optsObj),
					gnds = GeoNearDocumentSource.createFromJson(optsStr);

				assert.equal(gnds.source, null);
				assert.equal(gnds.limit, optsObj.limit);
				assert.deepEqual(gnds.query, optsObj.query);
				assert.ok(gnds.distanceField instanceof FieldPath);
				assert.equal(gnds.maxDistance, optsObj.maxDistance);
				assert.equal(gnds.uniqueDocs, optsObj.uniqueDocs);
				assert.ok(gnds.includeLocs instanceof FieldPath);
			}
		}
	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).grep(process.env.MOCHA_GREP || '').run(process.exit);