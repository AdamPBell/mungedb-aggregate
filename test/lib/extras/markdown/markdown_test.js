'use strict';
if (!module.parent) return require.cache[__filename] = 0, (new(require('mocha'))()).addFile(__filename).ui('exports').run(process.exit);
Error.prototype.showDiff = true; // enable mocha diffs (explicitly for now)


var assert = require('assert'),
	// aggregate = require('../../../../'),
	md = require('../../../../lib/extras/markdown');

exports.markdown = {

	'.getMarkdown()': {

		'document source': {

			'is $match': {

				'should get markdown for single equality': function() {
					var actual = md.getMarkdown([
							{$match: {
								a: 123,
							}},
						]),
						expected = [
							'0. find docs matching:',
							'    0. `a` == `123`',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

				'should get markdown for multiple equality (implicit $and)`': function() {
					var actual = md.getMarkdown([
							{$match: {
								a: 'foo',
								b: 'bar',
							}},
						]),
						expected = [
							'0. find docs matching:',
							'    0. all of:',
							'        0. `a` == `"foo"`',
							'        1. `b` == `"bar"`',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

				'should get markdown for multiple equality (explicit $and)`': function() {
					var actual = md.getMarkdown([
							{$match: {
								$and: [
									{a: 'foo'},
									{b: 'bar'},
								],
							}},
						]),
						expected = [
							'0. find docs matching:',
							'    0. all of:',
							'        0. `a` == `"foo"`',
							'        1. `b` == `"bar"`',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

				'should get markdown for $nin': function() {
					var actual = md.getMarkdown([
							{$match: {
								a: {$nin: ['foo', 'bar']},
							}},
						]),
						expected = [
							'0. find docs matching:',
							'    0. not all of:',
							'        0. `a` in `["foo", "bar"]`',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

			},

			'is $group': {

				'should get markdown if _id is constant': function() {
					var actual = md.getMarkdown([
							{$group: {
								_id: null,
							}},
						]),
						expected = [
							'0. group docs into buckets:',
							'    0. by `_id` which is from the constant `null`',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

				'should get markdown if _id is path': function() {
					var actual = md.getMarkdown([
							{$group: {
								_id: '$_id',
							}},
						]),
						expected = [
							'0. group docs into buckets:',
							'    0. by `_id` which is from `_id`',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

				'should get markdown if _id is complex': function() {
					var actual = md.getMarkdown([
							{$group: {
								_id: {
									fb: '$foo.bar',
								},
							}},
						]),
						expected = [
							'0. group docs into buckets:',
							'    0. by `_id` which is from:',
							'        0. `fb` from `foo.bar`',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

			},

			'is $project': {

				'should get markdown for explicit _id': function() {
					var actual = md.getMarkdown([
							{$project: {
								_id: 1,
							}}
						]),
						expected = [
							'0. for each doc build object:',
							'    0. `_id` from `_id` (unchanged)',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

				'should get markdown for implicit _id': function() {
					var actual = md.getMarkdown([
							{$project: {
								//_id: 1, //implied
							}},
						]),
						expected = [
							'0. for each doc build object:',
							'    0. `_id` from `_id` (unchanged)',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

				'should get markdown for implicit _id and other': function() {
					var actual = md.getMarkdown([
							{$project: {
								other: true,
							}},
						]),
						expected = [
							'0. for each doc build object:',
							'    0. `_id` from `_id` (unchanged)',
							'    1. `other` from `other` (unchanged)',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

				'should get markdown for excluded _id': function() {
					var actual = md.getMarkdown([
							{$project: {
								_id: 0,
							}},
						]),
						expected = [
							'0. for each doc empty object',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

				'should get markdown for excluded _id and other': function() {
					var actual = md.getMarkdown([
							{$project: {
								_id: 0,
								other: true,
							}},
						]),
						expected = [
							'0. for each doc build object:',
							'    0. `other` from `other` (unchanged)',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

				'should get markdown for computed _id and path': function() {
					var actual = md.getMarkdown([
							{$project: {
								_id: {$ifNull: ['$a', 2]},
								other: {$add: [1, 2]},
							}},
						]),
						expected = [
							'0. for each doc build object:',
							'    0. `_id` from `a` if not null or fallback to the constant `2`',
							'    1. `other` from ( the constant `1` + the constant `2` )',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

			},

			'is $sort': {

				'should get markdown for simple path in order': function() {
					var actual = md.getMarkdown([
							{$sort: {
								foo: 1,
							}}
						]),
						expected = [
							'0. sort docs by:',
							'    0. `foo`, in order',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

				'should get markdown for complex path in reverse order': function() {
					var actual = md.getMarkdown([
							{$sort: {
								'foo.bar': -1,
							}}
						]),
						expected = [
							'0. sort docs by:',
							'    0. `foo.bar`, in reverse order',
						].join('\n') + '\n';
					assert.equal(actual, expected);
				},

			},

		},

	},

};
