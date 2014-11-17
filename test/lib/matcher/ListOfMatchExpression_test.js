"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	MatchExpression = require("../../../lib/matcher/MatchExpression"),
	ListOfMatchExpression = require("../../../lib/matcher/ListOfMatchExpression");


exports.ListOfMatchExpression = {

	"Constructor": function Constructor() {
		var e = new ListOfMatchExpression("AND");
		assert.equal(e._matchType, "AND");
	},

	"Add": function Add() {
		var e = new ListOfMatchExpression();
		e.add(new MatchExpression("OR"));
		assert.equal(e._expressions[0]._matchType, "OR");
	},

	"Add2": function Add2() {
		var e = new ListOfMatchExpression();
		e.add(new MatchExpression("OR"));
		e.add(new MatchExpression("NOT"));
		assert.equal(e._expressions[0]._matchType, "OR");
		assert.equal(e._expressions[1]._matchType, "NOT");
	},

	"ClearAndRelease": function ClearAndRelease() {
		var e = new ListOfMatchExpression();
		e.add(new MatchExpression("OR"));
		e.add(new MatchExpression("NOT"));
		e.clearAndRelease();
		assert.equal(e._expressions.length, 0);
	},

	"NumChildren": function NumChildren() {
		var e = new ListOfMatchExpression();
		e.add(new MatchExpression("OR"));
		e.add(new MatchExpression("NOT"));
		assert.equal(e.numChildren(), 2);
	},

	"GetChild": function GetChild() {
		var e = new ListOfMatchExpression(),
			match1 = new MatchExpression("NOT");
		e.add(new MatchExpression("OR"));
		e.add(match1);
		assert.deepEqual(e.getChild(1), match1);
	},

	"GetChildVector": function GetChildVector() {
		var e = new ListOfMatchExpression(),
			match0 = new MatchExpression("NOT"),
			match1 = new MatchExpression("OR");
		e.add(match0);
		e.add(match1);
		assert.equal(e.getChildVector().length, 2);
	},

	"Equivalent": function Equivalent() {
		var e = new ListOfMatchExpression("TEXT"),
			f = new ListOfMatchExpression("TEXT");
		assert.equal(e.equivalent(f), true);
	},

};
