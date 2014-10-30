"use strict";
var assert = require("assert"),
	AndMatchExpression = require("../../../../lib/pipeline/matcher/AndMatchExpression.js"),
	LTMatchExpression = require("../../../../lib/pipeline/matcher/LTMatchExpression.js"),
	GTMatchExpression = require("../../../../lib/pipeline/matcher/GTMatchExpression.js"),
	MatchDetails = require("../../../../lib/pipeline/matcher/MatchDetails.js"),
	RegexMatchExpression = require("../../../../lib/pipeline/matcher/RegexMatchExpression.js"),
	EqualityMatchExpression = require("../../../../lib/pipeline/matcher/EqualityMatchExpression.js"),
	NotMatchExpression = require("../../../../lib/pipeline/matcher/NotMatchExpression.js");

module.exports = {
	"AndMatchExpression": {
		"Should match nothing with no clauses": function (){
			var op = new AndMatchExpression();
			assert.ok( op.matches({}));
		},
		"Should match with a three element clause": function() {
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
		},
		"Should match a single clause": function() {
			var nop = new NotMatchExpression();
			var eq = new EqualityMatchExpression();
			var op = new AndMatchExpression();

			assert.strictEqual(eq.init('a', 5).code, 'OK');
			assert.strictEqual(nop.init(eq).code, 'OK');
			op.add(nop);
			assert.ok( op.matches({'a':4}) );
			assert.ok( op.matches({'a':[4,6]}) );
			assert.ok( !op.matches({'a':5}) );
			assert.ok( !op.matches({'a':[4,5]}) );
		},
		"Should match three clauses": function(){
			var baseOperand1 = {"$gt":1},
				baseOperand2 = {"$lt":10},
				baseOperand3 = {"$lt":100},
				sub1 = new GTMatchExpression(),
				sub2 = new LTMatchExpression(),
				sub3 = new LTMatchExpression(),
				andOp = new AndMatchExpression();

			assert.strictEqual(sub1.init("a", baseOperand1.$gt).code, 'OK');
			assert.strictEqual(sub2.init("a", baseOperand2.$lt).code, 'OK');
			assert.strictEqual(sub3.init("b", baseOperand3.$lt).code, 'OK');

			andOp.add(sub1);
			andOp.add(sub2);
			andOp.add(sub3);

			assert.ok(andOp.matchesBSON({"a":5, "b":6}, null));
			assert.ok(!andOp.matchesBSON({"a":5}, null));
			assert.ok(!andOp.matchesBSON({"b":6}, null ));
			assert.ok(!andOp.matchesBSON({"a":1, "b":6}, null));
			assert.ok(!andOp.matchesBSON({"a":10, "b":6}, null));
		},
		"Should have an elemMatchKey": function(){
			var baseOperand1 = {"a":1},
				baseOperand2 = {"b":2},
				sub1 = new EqualityMatchExpression(),
				sub2 = new EqualityMatchExpression(),
				andOp = new AndMatchExpression(),
				details = new MatchDetails();

			assert.strictEqual(sub1.init("a", baseOperand1.a).code, 'OK');
			assert.strictEqual(sub2.init("b", baseOperand2.b).code, 'OK');

			andOp.add(sub1);
			andOp.add(sub2);

			details.requestElemMatchKey();
			assert.ok(!andOp.matchesBSON({"a":[1]}, details));
			assert.ok(!details.hasElemMatchKey());
			assert.ok(!andOp.matchesBSON({"b":[2]}, details));
			assert.ok(!details.hasElemMatchKey());
			assert.ok(andOp.matchesBSON({"a":[1], "b":[1, 2]}, details));
			assert.ok(details.hasElemMatchKey());
			// The elem match key for the second $and clause is recorded.
			assert.strictEqual("1", details.elemMatchKey());
		}


	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

