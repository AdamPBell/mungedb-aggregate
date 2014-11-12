"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	Variables = require("../../../../lib/pipeline/expressions/Variables");

exports.Variables = {

	"constructor": {

		"should be able to construct empty variables": function() {
			new Variables();
		},

		"should be able to give number of variables": function() {
			new Variables(5);
		},

		"should throw if not given a number": function() {
			assert.throws(function() {
				new Variables("hi");
			});
			assert.throws(function() {
				new Variables({});
			});
			assert.throws(function() {
				new Variables([]);
			});
			assert.throws(function() {
				new Variables(new Date());
			});
		},

		"setValue throws if no args given": function() {
			assert.throws(function() {
				var variables = new Variables();
				variables.setValue(1, "hi");
			});
		},

	},

	"#setRoot": {

		"should set the _root variable to the passed value": function() {
			var variables = new Variables(),
				root = {"hi":"hi"};
			variables.setRoot(root);
			assert.equal(root, variables._root);
		},

		"must be an object": function mustBeObject() {
			var variables = new Variables(),
				root = "hi";
			assert.throws(function() {
				variables.setRoot(root);
			});
		},

	},

	"#clearRoot": {

		"should set the _root variable to empty obj": function() {
			var variables = new Variables(),
				root = {"hi":"hi"};
			variables.setRoot(root);
			variables.clearRoot();
			assert.deepEqual({}, variables._root);
		},

	},

	"#getRoot": {

		"should return the _root variable": function() {
			var variables = new Variables(),
				root = {"hi":"hi"};
			variables.setRoot(root);
			assert.equal(root, variables.getRoot());
		},

	},

	"#setValue": {

		"id must be number": function() {
			assert.throws(function() {
				var variables = new Variables();
				variables.setValue("hi", 5);
			});
			assert.throws(function() {
				var variables = new Variables();
				variables.setValue(null, 5);
			});
			assert.throws(function() {
				var variables = new Variables();
				variables.setValue(new Date(), 5);
			});
			assert.throws(function() {
				var variables = new Variables();
				variables.setValue([], 5);
			});
			assert.throws(function() {
				var variables = new Variables();
				variables.setValue({}, 5);
			});
			assert.doesNotThrow(function() {
				var variables = new Variables(5);
				variables.setValue(1, 5);
			});
		},

		"cannot use root id": function() {
			assert.throws(function() {
				var variables = new Variables(5);
				variables.setValue(Variables.ROOT_ID, "hi");
			});
		},

		"cannot use id larger than initial size": function() {
			assert.throws(function() {
				var variables = new Variables(5);
				variables.setValue(5, "hi"); //off by one check
			});
			assert.throws(function() {
				var variables = new Variables(5);
				variables.setValue(6, "hi");
			});
		},

		"sets the value": function() {
			var variables = new Variables(5);
			variables.setValue(1, "hi"); //off by one check
			assert.equal(variables._rest[1], "hi");
		},

	},

	"#getValue": {

		"id must be number": function() {
			assert.throws(function() {
				var variables = new Variables();
				variables.getValue("hi", 5);
			});
			assert.throws(function() {
				var variables = new Variables();
				variables.getValue(null, 5);
			});
			assert.throws(function() {
				var variables = new Variables();
				variables.getValue(new Date(), 5);
			});
			assert.throws(function() {
				var variables = new Variables();
				variables.getValue([], 5);
			});
			assert.throws(function() {
				var variables = new Variables();
				variables.getValue({}, 5);
			});
			assert.doesNotThrow(function() {
				var variables = new Variables(5);
				variables.getValue(1, 5);
			});
		},

		"returns root when given root id": function() {
			var variables = new Variables(5),
				root = {hi:"hi"};
			variables.setRoot(root);
			variables.getValue(Variables.ROOT_ID, root);
		},

		"cannot use id larger than initial size": function() {
			assert.throws(function() {
				var variables = new Variables(5);
				variables.getValue(5, "hi"); //off by one check
			});
			assert.throws(function() {
				var variables = new Variables(5);
				variables.getValue(6, "hi");
			});
		},

		"gets the value": function() {
			var variables = new Variables(5);
			variables.setValue(1, "hi");
			assert.equal(variables.getValue(1), "hi");
		},

	},

	"#getDocument": {

		"id must be number": function() {
			assert.throws(function() {
				var variables = new Variables();
				variables.getDocument("hi", 5);
			});
			assert.throws(function() {
				var variables = new Variables();
				variables.getDocument(null, 5);
			});
			assert.throws(function() {
				var variables = new Variables();
				variables.getDocument(new Date(), 5);
			});
			assert.throws(function() {
				var variables = new Variables();
				variables.getDocument([], 5);
			});
			assert.throws(function() {
				var variables = new Variables();
				variables.getDocument({}, 5);
			});
			assert.doesNotThrow(function() {
				var variables = new Variables(5);
				variables.getDocument(1, 5);
			});
		},

		"returns root when given root id": function() {
			var variables = new Variables(5),
				root = {hi:"hi"};
			variables.setRoot(root);
			variables.getDocument(Variables.ROOT_ID, root);
		},

		"cannot use id larger than initial size": function() {
			assert.throws(function() {
				var variables = new Variables(5);
				variables.getDocument(5, "hi"); //off by one check
			});
			assert.throws(function() {
				var variables = new Variables(5);
				variables.getDocument(6, "hi");
			});
		},

		"gets the value": function() {
			var variables = new Variables(5),
				value = {hi:"hi"};
			variables.setValue(1, value);
			assert.equal(variables.getDocument(1), value);
		},

		"only returns documents": function() {
			var variables = new Variables(5),
				value = "hi";
			variables.setValue(1, value);
			assert.deepEqual(variables.getDocument(1), {});
		},

	},

};
