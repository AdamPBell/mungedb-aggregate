"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ErrorCodes = require("../../../../lib/Errors").ErrorCodes,
	matcher = require("../../../../lib/pipeline/matcher/"),
	NorMatchExpression = matcher.NorMatchExpression,
	EqualityMatchExpression = matcher.EqualityMatchExpression,
	NotMatchExpression = matcher.NotMatchExpression,
	GTMatchExpression = matcher.GTMatchExpression,
	LTMatchExpression = matcher.LTMatchExpression,
	MatchDetails = matcher.MatchDetails;

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
			assert.strictEqual( lt.init("a","z1").code,ErrorCodes.OK);
			assert.strictEqual( gt.init("a","a1").code,ErrorCodes.OK);
			assert.strictEqual( rgx.init("a","1","").code,ErrorCodes.OK);
			op.add(lt);
			op.add(gt);
			op.add(rgx);
			assert.ok( op.matches({"a":"r1"}) );
			assert.ok( ! op.matches({"a": "z1"}) );
			assert.ok( ! op.matches({"a": "a1"}) );
			assert.ok( ! op.matches({"a":"r"}) );
		},*/
		"Should match a single clause": function() {
			var nop = new NotMatchExpression();
			var eq = new EqualityMatchExpression();
			var op = new NorMatchExpression();

			assert.strictEqual(eq.init("a", 5).code, ErrorCodes.OK);
			assert.strictEqual(nop.init(eq).code, ErrorCodes.OK);
			op.add(nop);
			assert.ok( ! op.matches({"a":4}) );
			assert.ok( ! op.matches({"a":[4,6]}) );
			assert.ok( op.matches({"a":5}) );
			assert.ok( op.matches({"a":[4,5]}) );
		},
		"Should match three clauses": function(){
			var baseOperand1 = {"$gt":10},
				baseOperand2 = {"$lt":0},
				baseOperand3 = {"b":100},
				sub1 = new GTMatchExpression(),
				sub2 = new LTMatchExpression(),
				sub3 = new EqualityMatchExpression(),
				orOp = new NorMatchExpression();

			assert.strictEqual(sub1.init("a", baseOperand1.$gt).code, ErrorCodes.OK);
			assert.strictEqual(sub2.init("a", baseOperand2.$lt).code, ErrorCodes.OK);
			assert.strictEqual(sub3.init("b", baseOperand3.b).code, ErrorCodes.OK);

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

			assert.strictEqual(sub1.init("a", baseOperand1.a).code, ErrorCodes.OK);
			assert.strictEqual(sub2.init("b", baseOperand2.b).code, ErrorCodes.OK);

			orOp.add(sub1);
			orOp.add(sub2);

			details.requestElemMatchKey();
			assert.ok( orOp.matchesJSON({"a":[10], "b":[10]}, details));
			assert.ok(!details.hasElemMatchKey());

			assert.ok( ! orOp.matchesJSON({"a":[1], "b":[1, 2]}, details));
			assert.ok(!details.hasElemMatchKey());


		}


	}
};
