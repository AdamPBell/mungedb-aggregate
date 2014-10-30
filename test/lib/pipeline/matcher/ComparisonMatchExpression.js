"use strict";
var assert = require("assert"),
	ComparisonMatchExpression = require("../../../../lib/pipeline/matcher/ComparisonMatchExpression");


module.exports = {
	"ComparisonMatchExpression": {

		"Should properly initialize with an empty path and a number": function (){
			var e = new ComparisonMatchExpression();
			e._matchType = 'LT';
			assert.strictEqual(e.init('', 5 ).code,'OK');
		},
		"Should not initialize when given an undefined rhs": function() {
			var e = new ComparisonMatchExpression();
			assert.strictEqual(e.init('',5).code,'BAD_VALUE');
			e._matchType = 'LT';
			assert.strictEqual(e.init('',{}).code,'BAD_VALUE');	
			assert.strictEqual(e.init('',undefined).code,'BAD_VALUE');
			assert.strictEqual(e.init('',{}).code,'BAD_VALUE');
		},
		"Should match numbers with GTE": function (){
			var e = new ComparisonMatchExpression();
			e._matchType = 'GTE';
			assert.strictEqual(e.init('',5).code,'OK');
			assert.ok(e.matchesSingleElement(6), "6 ≥ 5");
			assert.ok(e.matchesSingleElement(5), "5 ≥ 5");
			assert.ok(!e.matchesSingleElement(4), "4 ≥ 5");
			assert.ok(!e.matchesSingleElement('foo'), "5 ≥ 'foo'");
		},
		"Should match with simple paths and GTE": function(){
			var e = new ComparisonMatchExpression();
			e._matchType = 'GTE';
			assert.strictEqual(e.init('a', 5).code,'OK');
			assert.ok(e.matches({'a':6}));
		},
		"Should match arrays with GTE": function (){
			var e = new ComparisonMatchExpression();
			e._matchType = 'GTE';
			assert.strictEqual(e.init('a',5).code,'OK');
			assert.ok(e.matches({'a':[6,10]}),'[6,10] ≥ 5');
			assert.ok(e.matches({'a':[4,5.5]}), '[4,5.5] ≥ 5');
			assert.ok(!e.matches({'a':[1,2]}),'[1,2] ≥ 5');
			assert.ok(e.matches({'a':[1,10]}),'[1,10] ≥ 5');
		}
	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

