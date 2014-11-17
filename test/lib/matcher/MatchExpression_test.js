"use strict";

var assert = require("assert"),
	EqualityMatchExpression = require("../../../../lib/pipeline/matcher/EqualityMatchExpression"),
	LTEMatchExpression = require("../../../../lib/pipeline/matcher/LTEMatchExpression"),
	LTMatchExpression = require("../../../../lib/pipeline/matcher/LTMatchExpression"),
	GTEMatchExpression = require("../../../../lib/pipeline/matcher/GTEMatchExpression"),
	GTMatchExpression = require("../../../../lib/pipeline/matcher/GTMatchExpression");

module.exports = {

	"LeafMatchExpression":{

		"Equal1":function Equal1() {
			var temp = {x:5},
				e = new EqualityMatchExpression();
			e.init("x", temp.x);
			assert(e.matchesJSON({x:5}));
			assert(e.matchesJSON({x:[5]}));
			assert(e.matchesJSON({x:[1,5]}));
			assert(e.matchesJSON({x:[1,5,2]}));
			assert(e.matchesJSON({x:[5,2]}));

			assert(!(e.matchesJSON({x:null})));
			assert(!(e.matchesJSON({x:6})));
			assert(!(e.matchesJSON({x:[4,2]})));
			assert(!(e.matchesJSON({x:[[5]]})));
		},

		"Comp1":{

			"LTEMatchExpression": function () {
				var temp = {x:5},
					e = new LTEMatchExpression();
				e.init("x", temp.x);
				assert(e.matchesJSON({x:5}));
				assert(e.matchesJSON({x:4}));
				assert(!(e.matchesJSON({x:6})));
				assert(!(e.matchesJSON({x:"eliot"})));
			},

			"LTMatchExpression": function () {
				var temp = {x:5},
					e = new LTMatchExpression();
				e.init("x", temp.x);
				assert(!(e.matchesJSON({x:5})));
				assert(e.matchesJSON({x:4}));
				assert(!(e.matchesJSON({x:6})));
				assert(!(e.matchesJSON({x:"eliot"})));
			},

			"GTEMatchExpression": function () {
				var temp = {x:5},
					e = new GTEMatchExpression();
				e.init("x", temp.x);
				assert(e.matchesJSON({x:5}));
				assert(!(e.matchesJSON({x:4})));
				assert(e.matchesJSON({x:6}));
				assert(!(e.matchesJSON({x:"eliot"})));
			},

			"GTMatchExpression": function () {
				var temp = {x:5},
					e = new GTMatchExpression();
				e.init("x", temp.x);
				assert(!(e.matchesJSON({x:5})));
				assert(!(e.matchesJSON({x:4})));
				assert(e.matchesJSON({x:6}));
				assert(!(e.matchesJSON({x:"eliot"})));
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
