"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	EqualityMatchExpression = require("../../../lib/matcher/EqualityMatchExpression"),
	LTEMatchExpression = require("../../../lib/matcher/LTEMatchExpression"),
	LTMatchExpression = require("../../../lib/matcher/LTMatchExpression"),
	GTEMatchExpression = require("../../../lib/matcher/GTEMatchExpression"),
	GTMatchExpression = require("../../../lib/matcher/GTMatchExpression");

exports.LeafMatchExpression = {

	"Equal1": function Equal1() {
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

		"LTEMatchExpression": function() {
			var temp = {x:5},
				e = new LTEMatchExpression();
			e.init("x", temp.x);
			assert(e.matchesJSON({x:5}));
			assert(e.matchesJSON({x:4}));
			assert(!(e.matchesJSON({x:6})));
			assert(!(e.matchesJSON({x:"eliot"})));
		},

		"LTMatchExpression": function() {
			var temp = {x:5},
				e = new LTMatchExpression();
			e.init("x", temp.x);
			assert(!(e.matchesJSON({x:5})));
			assert(e.matchesJSON({x:4}));
			assert(!(e.matchesJSON({x:6})));
			assert(!(e.matchesJSON({x:"eliot"})));
		},

		"GTEMatchExpression": function() {
			var temp = {x:5},
				e = new GTEMatchExpression();
			e.init("x", temp.x);
			assert(e.matchesJSON({x:5}));
			assert(!(e.matchesJSON({x:4})));
			assert(e.matchesJSON({x:6}));
			assert(!(e.matchesJSON({x:"eliot"})));
		},

		"GTMatchExpression": function() {
			var temp = {x:5},
				e = new GTMatchExpression();
			e.init("x", temp.x);
			assert(!(e.matchesJSON({x:5})));
			assert(!(e.matchesJSON({x:4})));
			assert(e.matchesJSON({x:6}));
			assert(!(e.matchesJSON({x:"eliot"})));
		},

	},

};
