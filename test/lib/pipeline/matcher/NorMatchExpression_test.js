"use strict";
var assert = require("assert"),
	NorMatchExpression = require("../../../../lib/pipeline/matcher/NorMatchExpression.js"),
	AndMatchExpression = require("../../../../lib/pipeline/matcher/AndMatchExpression.js"),
	LTMatchExpression = require("../../../../lib/pipeline/matcher/LTMatchExpression.js"),
	GTMatchExpression = require("../../../../lib/pipeline/matcher/GTMatchExpression.js"),
	MatchDetails = require("../../../../lib/pipeline/matcher/MatchDetails.js"),
	RegexMatchExpression = require("../../../../lib/pipeline/matcher/RegexMatchExpression.js"),
	EqualityMatchExpression = require("../../../../lib/pipeline/matcher/EqualityMatchExpression.js"),
	NotMatchExpression = require("../../../../lib/pipeline/matcher/NotMatchExpression.js");

module.exports = {
	"NorMatchExpression": {
		"Should match nothing with no clauses": function (){
			var op = new NorMatchExpression();
			assert.ok( op.matches({}));
		},
		/*"Should match with a three element clause": function() {
			var lt = new LTMatchExpression();
			var gt = new GTMatchExpression();
			var rgx = new RegexMatchExpression();
			var op = new AndMatchExpression();
			assert.strictEqual( lt.init('a','z1').code,'OK');
			assert.strictEqual( gt.init('a','a1').code,'OK');
			assert.strictEqual( rgx.init('a','1','').code,'OK');
			op.add(lt);
			op.add(gt);
			op.add(rgx);
			assert.ok( op.matches({'a':'r1'}) );
			assert.ok( ! op.matches({'a': 'z1'}) );
			assert.ok( ! op.matches({'a': 'a1'}) );
			assert.ok( ! op.matches({'a':'r'}) );
		},*/
		"Should match a single clause": function() {
			var nop = new NotMatchExpression();
			var eq = new EqualityMatchExpression();
			var op = new NorMatchExpression();

			assert.strictEqual(eq.init('a', 5).code, 'OK');
			assert.strictEqual(nop.init(eq).code, 'OK');
			op.add(nop);
			assert.ok( ! op.matches({'a':4}) );
			assert.ok( ! op.matches({'a':[4,6]}) );
			assert.ok( op.matches({'a':5}) );
			assert.ok( op.matches({'a':[4,5]}) );
		},
		"Should match three clauses": function(){
			var baseOperand1 = {"$gt":10},
				baseOperand2 = {"$lt":0},
				baseOperand3 = {'b':100},
				sub1 = new GTMatchExpression(),
				sub2 = new LTMatchExpression(),
				sub3 = new EqualityMatchExpression(),
				orOp = new NorMatchExpression();

			assert.strictEqual(sub1.init("a", baseOperand1.$gt).code, 'OK');
			assert.strictEqual(sub2.init("a", baseOperand2.$lt).code, 'OK');
			assert.strictEqual(sub3.init("b", baseOperand3.b).code, 'OK');

			orOp.add(sub1);
			orOp.add(sub2);
			orOp.add(sub3);

			assert.ok( ! orOp.matches({"a":-1}));
			assert.ok( ! orOp.matches({"a":11}));
			assert.ok( orOp.matches({"a":5}));
			assert.ok( ! orOp.matches({"b":100}));
			assert.ok( orOp.matches({"b":101}));
			assert.ok( orOp.matches({}));
			assert.ok( ! orOp.matches({"a":11, "b":100}));
		},
		"Should have an elemMatchKey": function(){
			var baseOperand1 = {"a":1},
				baseOperand2 = {"b":2},
				sub1 = new EqualityMatchExpression(),
				sub2 = new EqualityMatchExpression(),
				orOp = new NorMatchExpression(),
				details = new MatchDetails();

			assert.strictEqual(sub1.init("a", baseOperand1.a).code, 'OK');
			assert.strictEqual(sub2.init("b", baseOperand2.b).code, 'OK');

			orOp.add(sub1);
			orOp.add(sub2);

			details.requestElemMatchKey();
			assert.ok( orOp.matchesJSON({"a":[10], 'b':[10]}, details));
			assert.ok(!details.hasElemMatchKey());

			assert.ok( ! orOp.matchesJSON({"a":[1], "b":[1, 2]}, details));
			assert.ok(!details.hasElemMatchKey());


		}


	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

