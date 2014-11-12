"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	utils = require("./utils");

exports.utils = {

	".constify()": {

		"simple": function() {
			var original = {
					a: 1,
					b: "s"
				},
				expected = {
					a: {
						$const: 1
					},
					b: {
						$const: "s"
					}
				};
			assert.deepEqual(utils.constify(original), expected);
		},

		"array": function() {
			var original = {
					a: ["s"]
				},
				expected = {
					a: [
						{
							$const: "s"
						}
					]
				};
			assert.deepEqual(utils.constify(original), expected);
		},

		"array2": function() {
			var original = {
					a: [
						"s",
						[5],
						{
							a: 5
						}
					]
				},
				expected = {
					a: [{
							$const: "s"
					},
						{
							$const: [5]
					},
						{
							a: {
								$const: 5
							}
					}]
				};
			assert.deepEqual(utils.constify(original), expected);
		},

		"object": function() {
			var original = {
					a: {
						b: {
							c: 5
						},
						d: "hi"
					}
				},
				expected = {
					a: {
						b: {
							c: {
								"$const": 5
							}
						},
						d: {
							"$const": "hi"
						}
					}
				};
			assert.deepEqual(utils.constify(original), expected);
		},

		"fieldPathExpression": function() {
			var original = {
				a: "$field.path"
			};
			assert.deepEqual(utils.constify(original), original);
		},

	},

};
