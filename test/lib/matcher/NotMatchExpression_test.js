"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ErrorCodes = require("../../../lib/errors").ErrorCodes,
	matcher = require("../../../lib/matcher/"),
	NotMatchExpression = matcher.NotMatchExpression,
	LTMatchExpression = matcher.LTMatchExpression,
	MatchDetails = matcher.MatchDetails;

exports.NotMatchExpression = {

	"should match a scalar": function() {
		var lt = new LTMatchExpression();
		assert.strictEqual(lt.init("a", 5).code, ErrorCodes.OK);
		var op = new NotMatchExpression();
		assert.strictEqual( op.init(lt).code, ErrorCodes.OK);
		assert.ok( op.matches({"a":6}), "{$not: {$lt: 5}}, {a:6}" );
		assert.ok( !op.matches({"a":4}), "{$not: {$lt: 5}}, {a:4}" );
	},

	"should match an Array": function() {
		var lt = new LTMatchExpression();
		assert.strictEqual(lt.init("a",5).code, ErrorCodes.OK);
		var op = new NotMatchExpression();
		assert.strictEqual(op.init(lt).code, ErrorCodes.OK);
		assert.ok( op.matches({"a": [6]}) , "{$not: {$lt: 5}}, {a: [6]}");
		assert.ok( !op.matches({"a": [4]}) , "{$not: {$lt: 5}}, {a: [4]}");
		assert.ok( !op.matches({"a": [4,5,6]}) , "{$not: {$lt: 5}}, {a: [4,5,6]}");
	},

	"should not have an ElemMatchKey": function() {
		var lt = new LTMatchExpression();
		assert.strictEqual(lt.init("a",5).code, ErrorCodes.OK);
		var op = new NotMatchExpression();
		assert.strictEqual( op.init( lt ).code, ErrorCodes.OK);
		var details = new MatchDetails();
		details.requestElemMatchKey();
		assert.ok( ! op.matches({"a":[1]}, details), "{$not: {a: {$lt : 5}}}, {a: [1]}" );
		assert.ok( ! details.hasElemMatchKey() , "ElemMatchKey Check");
		assert.ok( op.matches({"a": 6 }, details), "{$not: {a: {$lt : 5}}},{a: 6}");
		assert.ok( ! details.hasElemMatchKey(), "ElemMatchKey Check");
		assert.ok( op.matches({"a":[6]}, details), "{$not: {a: {$lt : 5}}}, {a:[6]}");
		assert.ok( ! details.hasElemMatchKey() );
	},

};
