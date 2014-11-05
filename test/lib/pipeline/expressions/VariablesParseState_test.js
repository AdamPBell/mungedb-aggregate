"use strict";
var assert = require("assert"),
	Variables = require("../../../../lib/pipeline/expressions/Variables"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState");


module.exports = {

	"VariablesParseState": {

		"constructor": {

			"Should be able to construct": function canConstruct() {
				var idGen = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGen);
			},

			"Should throw given invalid args": function throwsForArgs() {
				assert.throws(function() {
					var vps = new VariablesParseState();
				});
				assert.throws(function() {
					var vps = new VariablesParseState(1);
				});
				assert.throws(function() {
					var vps = new VariablesParseState('hi');
				});
				assert.throws(function() {
					var vps = new VariablesParseState({});
				});
				assert.throws(function() {
					var vps = new VariablesParseState([]);
				});
				assert.throws(function() {
					var vps = new VariablesParseState(new Date());
				});
			}

		},

		"#defineVariable": {

			"Cannot define ROOT variable": function noCanRootDef() {
				var idGen = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGen);
				assert.throws(function() {
					vps.defineVariable('ROOT', 5);
				});
			},

			"Should return new ids": function returnsNewIds() {
				var idGen = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGen),
					firstId = vps.defineVariable('hi', 'bye'),
					secondId = vps.defineVariable('bye', 'hi');
				assert.notEqual(firstId, secondId);
			}

		},

		"#getVariable": {

			"Can retrieve defined variables": function getVariable() {
				var idGen = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGen),
					firstId = vps.defineVariable('hi', 'bye'),
					firstVariable = vps.getVariable('hi');
				assert.equal(firstVariable, firstId);
			},

			"Can retrieve root id": function getVariable() {
				var idGen = new VariablesIdGenerator(),
					vps = new VariablesParseState(idGen),
					firstVariable = vps.getVariable('ROOT');
				assert.equal(firstVariable, Variables.ROOT_ID);
			}
		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
