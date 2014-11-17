"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ErrorCodes = require("../../../lib/errors").ErrorCodes,
	MatchDetails = require("../../../lib/matcher/MatchDetails"),
	TypeMatchExpression = require("../../../lib/matcher/TypeMatchExpression");


exports.TypeMatchExpression = {

	"should match string type": function () {
		var e = new TypeMatchExpression();

		assert.strictEqual(e.init("", 2).code, ErrorCodes.OK);

		assert.ok(e.matches("abc"));
		assert.ok(! e.matches(2));
	},

	"should match null type": function () {
		var e = new TypeMatchExpression();

		assert.strictEqual(e.init("", 10).code, ErrorCodes.OK);

		assert.ok(e.matches(null));
		assert.ok(!e.matches(10));
	},

	"should match unknown type": function () {
		var e = new TypeMatchExpression();

		assert.strictEqual(e.init("", 1024).code, ErrorCodes.OK);

		assert.ok(!e.matches(1024));
		assert.ok(!e.matches("abc"));
	},

	"should match bool type": function () {
		var e = new TypeMatchExpression();

		assert.strictEqual(e.init("", 8).code, ErrorCodes.OK);

		assert.ok(e.matches(true));
		assert.ok(!e.matches(8));
	},

	"should match number type": function () {
		var e = new TypeMatchExpression();
		e.init("a", 1);

		assert.strictEqual(e.init("a", 1).code, ErrorCodes.OK);

		assert.ok(e.matches({"a":[4]}));
		assert.ok(e.matches({"a":[4, "a"]}));
		assert.ok(e.matches({"a":["a", 4]}));
		assert.ok(!e.matches({"a":["a"]}));
		assert.ok(!e.matches({"a":[[4]]}));

	},

	"should match array type": function () {
		var e = new TypeMatchExpression();

		assert.strictEqual(e.init("a", 4).code, ErrorCodes.OK);

		assert.ok(!e.matches({a: []}));
		assert.ok(e.matches({a: [[2]]}));
		assert.ok(!e.matches({a: "bar"}));
	},

	"should match null type expanded": function () {
		var e = new TypeMatchExpression();

		assert.strictEqual(e.init("a", 10).code, ErrorCodes.OK);

		assert.ok(e.matches({a: null}));
		assert.ok(!e.matches({a: 4}));
		assert.ok(!e.matches({}));

	},

	"should match and preserve elemMatchKey": function () {
		var e = new TypeMatchExpression(),
			m = new MatchDetails();

		m.requestElemMatchKey();

		assert.strictEqual(e.init("a.b", 2).code, ErrorCodes.OK);

		assert.ok(!e.matches({a: 1}, m));
		assert.ok(!m.hasElemMatchKey());

		assert.ok(e.matches({a: {b: "string"}}, m));
		assert.ok(!m.hasElemMatchKey());

		assert.ok(e.matches({a: {b: ["string"]}}, m));
		assert.ok(m.hasElemMatchKey());
		assert.strictEqual("0", m.elemMatchKey());

		assert.ok(e.matches({a: [2, {b: ["string"]}]}, m));
		assert.ok(m.hasElemMatchKey());

		assert.strictEqual("1", m.elemMatchKey());
	},

	"should be equivalent": function() {
		var a = new TypeMatchExpression(),
			b = new TypeMatchExpression(),
			c = new TypeMatchExpression();

		assert.strictEqual(a.init("a", 2).code, ErrorCodes.OK);
		assert.strictEqual(b.init("a", 1).code, ErrorCodes.OK);
		assert.strictEqual(c.init("b", 2).code, ErrorCodes.OK);

		assert.ok(a.equivalent(a));
		assert.ok(!a.equivalent(b));
		assert.ok(!a.equivalent(c));
	},

};
