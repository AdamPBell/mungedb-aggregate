"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	GeoNearDocumentSource = require("../../../../lib/pipeline/documentSources/GeoNearDocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	ArrayRunner = require("../../../../lib/query/ArrayRunner"),
	FieldPath = require("../../../../lib/pipeline/FieldPath");

function createGeoNear(ctx) {
	var ds = new GeoNearDocumentSource(ctx);
	return ds;
}

function addSource(ds, data) {
	var cds = new CursorDocumentSource(null, new ArrayRunner(data), null);
	ds.setSource(cds);
}

module.exports = {

	"GeoNearDocumentSource": {

		"constructor()":{

			"should not throw when constructing without args":function() {
				assert.doesNotThrow(function(){
					createGeoNear();
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
				var input = [{}];
				var gnds = createGeoNear();

				assert.throws(function(){
					addSource(gnds, input);
				});
			}

		},

		"#createFromJson()":{

			"method creates GeoNearDocumentSource with appropriate options":function() {
				var opts = {
						// example options
						near:[40.724, -73.997],
						limit:25,
						query:{type:"public"},
						distanceField: "dist.calculated",
						maxDistance:0.8,
						uniqueDocs:true,
						includeLocs:"dist.location"
					},
					gnds = GeoNearDocumentSource.createFromJson(opts);

				assert.equal(gnds.source, null);
				assert.equal(gnds.limit, opts.limit);
				assert.deepEqual(gnds.query, opts.query);
				assert.ok(gnds.distanceField instanceof FieldPath);
				assert.equal(gnds.maxDistance, opts.maxDistance);
				assert.equal(gnds.uniqueDocs, opts.uniqueDocs);
				assert.ok(gnds.includeLocs instanceof FieldPath);
			}
		}
	}
};
