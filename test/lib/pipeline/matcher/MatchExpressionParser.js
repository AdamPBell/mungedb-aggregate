"use strict";
var assert = require("assert"),
	MatchExpressionParser = require("../../../../lib/pipeline/matcher/MatchExpressionParser");


module.exports = {
	"MatchExpressionParser": {
		"Should generate matchers that work with no operators": function (){
			var goodQ = {'x':2},badQ = {'x':3};
			var parser =  new MatchExpressionParser();
			var res = parser.parse(goodQ);
			assert.strictEqual(res.code,'OK',res.description);
			assert.ok( res.result.matches(goodQ));
			assert.ok( ! res.result.matches(badQ));
		},
		"Should parse {x:5,y:{$gt:5, :$lt:8}}": function() {
			var q = {'x':5, 'y':{'$gt':5, '$lt':8}};
			var parser = new MatchExpressionParser();
			var res = parser.parse( q );
			assert.strictEqual(res.code,'OK',res.description);
			assert.ok( res.result.matches({'x':5, 'y':7}) );
			assert.ok( res.result.matches({'x':5, 'y':6}) );
			assert.ok( ! res.result.matches({'x':6, 'y':7}) );
			assert.ok( ! res.result.matches({'x':5, 'y':9}) );
			assert.ok( ! res.result.matches({'x':5, 'y':4}) );
		},
		"Should parse $isolated and $atomic appropriately": function() {
			var q1 = {'x':5, '$atomic': {'$gt':5, '$lt':8}},
				q2 = {'x':5, '$isolated':1},
				q3 = {'x':5, 'y':{'$isolated':1}};
			var parser = new MatchExpressionParser();
			var t = parser.parse(q1);

			assert.strictEqual(parser.parse(q1).code, 'OK');
			assert.strictEqual(parser.parse(q2).code, 'OK');
			assert.strictEqual(parser.parse(q3).code, 'BAD_VALUE');
		},
		"Should parse and match $size with an int": function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$size':2}};

			var res = parser.parse(q);
			assert.strictEqual(res.code,'OK',res.description);
			assert.ok( ! res.result.matches({'x':1}) );
			assert.ok( res.result.matches({'x':[1,2]}) );
			assert.ok( ! res.result.matches({'x':[1]}) );
			assert.ok( ! res.result.matches({'x':[1,2,3]}) );
		},
		"Should parse and match $size with a string argument": function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$size':'a'}};

			var res = parser.parse( q );
			assert.strictEqual(res.code,'OK',res.description);
			assert.ok( ! res.result.matches({'x':1}) );
			assert.ok( ! res.result.matches({'x':[1,2]}) );
			assert.ok( res.result.matches({'x':[]}) );
			assert.ok( ! res.result.matches({'x': [1]}) );
		},
		"Should parse and match $size with a float argument":function() {
			var parser = new MatchExpressionParser();
			var q = {'x': {'$size': 2.5}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':1}) );
			assert.ok( ! res.result.matches({'x':[1,2]}) );
			assert.ok( ! res.result.matches({'x':[]}) );
			assert.ok( ! res.result.matches({'x':[1,2,3]}) );
		},
		"Should not accept  null": function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$size':null}};

			var res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );
		},
		"Should parse $elemMatch : {x:1,y:2}": function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$elemMatch': {'x':1,'y':2}}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':1}) );
			assert.ok( ! res.result.matches({'x':[1,2]}) );
			assert.ok( ! res.result.matches({'x':[{'x':1}]}) );
			assert.ok( res.result.matches({'x': [{'x':1,'y':2}]}) );
		},
		"Should parse and match $elemMatch: {$gt:5}": function() {
			var parser = new MatchExpressionParser();
			var q = {'x': {'$elemMatch': {'$gt':5}}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':1}) );
			assert.ok( ! res.result.matches({'x':[4]}) );
			assert.ok( res.result.matches({'x':[6]}) );
		},
		"Should parse and match $all:[1,2]" : function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$all':[1,2]}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':1}) );
			assert.ok( ! res.result.matches({'x':[1]}) );
			assert.ok( ! res.result.matches({'x':[2]}) );
			assert.ok( res.result.matches({'x':[1,2]}) );
			assert.ok( res.result.matches({'x':[1,2,3]}) );
			assert.ok( ! res.result.matches({'x':[2,3]}) );
		},
		"Should not allow $all to have an element argument": function() {
			var parser = new MatchExpressionParser();
			var q = {'x': {'$all':1}};

			var res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );
		},
		"Should not allow large regex patterns": function () {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$all':[new RegExp((new Array(50*1000+1)).join('z'))] }};

			var res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );
		},
		"Should parse and match some simple regex patterns": function() {
			var parser = new MatchExpressionParser();
			var a = /^a/;
			var b = /B/i;
			var q = {'a': {'$all': [ a , b ]}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'a':'ax'}) );
			assert.ok( ! res.result.matches({'a':'qqb'}) );
			assert.ok( res.result.matches({'a':'ab'}) );
		},
		"Should parse and match some more simple regexes" : function(){
			var parser = new MatchExpressionParser();
			var a = /^a/;
			var b = /abc/;
			var q = {'a': {'$all': [a, b]}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'a':'ax'}) );
			assert.ok( res.result.matches({'a':'abc'}) );
		},
		"Should properly handle x:{$all:[5]}": function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$all':[5]}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':5}) );
			assert.ok( res.result.matches({'x':[5]}) );
			assert.ok( ! res.result.matches({'x':4}) );
			assert.ok( ! res.result.matches({'x':[4]}) );
		},
		"Should handle a good $all $elemMatch query": function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$all':[{'$elemMatch': {'x':1,'y':2}}]}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':1}) );
			assert.ok( ! res.result.matches({'x':[1,2]}) );
			assert.ok( ! res.result.matches({'x':[{'x':1}]}) );
			assert.ok( res.result.matches({'x':[{'x':1,'y':2}]}) );
		},
		"Should properly not parse bad $all $elemMatch queries": function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$all':[{'$elemMatch':{'x':1,'y':2}}, 5]}};

			var res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );

			q = {'x':{'$all':[5,{'$elemMatch':{'x':1,'y':2}}]}};
			res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );
		},
		"Should parse and match simple $eq": function () {
			var parser = new MatchExpressionParser();
			var q = {'x': {'$eq': 2}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':1}) );
			assert.ok( res.result.matches({'x':2}) );
			assert.ok( ! res.result.matches({'x':3}) );
		},
		"Should parse and match simple $gt": function() {
			var parser = new MatchExpressionParser();
			var q = {'x': {'$gt':2}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':2}) );
			assert.ok( res.result.matches({'x':3}) );
		},
		"Should parse and match a simple $lt": function () {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$lt':2}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':1}) );
			assert.ok( ! res.result.matches({'x':2}) );
			assert.ok( ! res.result.matches({'x':3}) );
		},
		"Should parse and match simple $gte": function() {
			var parser = new MatchExpressionParser();
			var q = {'x': {'$gte':2}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':1}) );
			assert.ok( res.result.matches({'x':2}) );
			assert.ok( res.result.matches({'x':3}) );
		},
		"Should parse and matc simple $lte": function() {
			var parser = new MatchExpressionParser();
			var q = {'x': {'$lte':2}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':1}) );
			assert.ok( res.result.matches({'x':2}) );
			assert.ok( ! res.result.matches({'x':3}) );
		},
		"Should parse and match simple $ne": function() {
			var parser = new MatchExpressionParser();
			var q = {'x': {'$ne':2}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':1}) );
			assert.ok( ! res.result.matches({'x':2}) );
			assert.ok( res.result.matches({'x':3}) );
		},
		"Should parse simple $mod patterns":function(){
			var parser = new MatchExpressionParser();
			var q = {'x':{'$mod':[3,2]}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );

			q = {'x':{'$mod':[3]}};
			res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );

			q = {'x':{'$mod':[3,2,4]}};
			res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );

			q = {'x':{'$mod':['q',2]}};
			res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );

			q = {'x':{'$mod':3}};
			res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );

			q = {'x':{'$mod':{'a':1,'b':2}}};
			res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );
		},
		"Should parse and match simple $mod": function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$mod':[3,2]}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':5}) );
			assert.ok( ! res.result.matches({'x':4}) );
			assert.ok( res.result.matches({'x':8}) );
		},
		"Should treat a second arg to $mod that is a string as a 0": function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$mod':[2,'r']}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':2}) );
			assert.ok( res.result.matches({'x':4}) );
			assert.ok( ! res.result.matches({'x':5}) );
			assert.ok( ! res.result.matches({'x':'a'}) );
		},
		"Should parse and match a simple $in": function() {
			var parser = new MatchExpressionParser();
			var q = {'x': {'$in':[2,3]}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':1}) );
			assert.ok( res.result.matches({'x':2}) );
			assert.ok( res.result.matches({'x':3}) );
		},
		"Should not accept a scalar as an arg to $in" : function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$in': 5}};

			var res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );
		},
		"Should not accept an $elemMatch as an arg to an $in": function () {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$in':[{'$elemMatch': 1}]}};

			var res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );
		},
		"Should not parse regexes that are too long": function() {
			var parser = new MatchExpressionParser();
			var str = (new Array(50*1000+1).join('z'));
			var q = {'x': {'$in':[new RegExp(str)]}};

			var res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );

			q = {'x':{'$in': [{'$regex': str}]}};
			res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );
		},
		"Should parse and match $regex in an $in expression": function() {
			var parser = new MatchExpressionParser();
			var a = /^a/;
			var b = /B/i;
			var q = {'a': {'$in': [a,b,"2",4]}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'a':'ax'}) );
			assert.ok( res.result.matches({'a':/^a/}) );
			assert.ok( res.result.matches({'a':'qqb'}) );
			assert.ok( res.result.matches({'a':/B/i}) );
			assert.ok( res.result.matches({'a':4}) );
			assert.ok( ! res.result.matches({'a':'l'}) );
			assert.ok( ! res.result.matches({'a':/B/}) );
		},
		"Should parse and match a simple $nin": function() {
			var parser = new MatchExpressionParser();
			var q = {'x': {'$nin': [2,3]}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':1}) );
			assert.ok( ! res.result.matches({'x':2}) );
			assert.ok( ! res.result.matches({'x':3}) );
		},
		"Should not accept a scalar argument to $nin":function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{$nin: 5}};

			var res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );
		},
		"Should properly handle /regex/i":function() {
			var parser = new MatchExpressionParser();
			var a = /abc/i;
			var q = {'x': a };

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':'ABC'}) );
			assert.ok( res.result.matches({'x':'abc'}) );
			assert.ok( ! res.result.matches({'x':'AC'}) );
		},
		"Should properly handle $regex x $option i": function() {
			var parser = new MatchExpressionParser();
			var q = {'x': {'$regex': 'abc', '$options':'i'}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':'abc'}) );
			assert.ok( res.result.matches({'x':'ABC'}) );
			assert.ok( ! res.result.matches({'x':'AC'}) );
		},
		"Should properly handle $option i $regex x": function () {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$options': 'i', '$regex': 'abc'}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':'abc'}) );
			assert.ok( res.result.matches({'x':'ABC'}) );
			assert.ok( ! res.result.matches({'x':'AC'}) );
		},
		"Should not accept $optionas":function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$regex':'abc', '$optionas':'i'}};

			var res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );

			q = {'x':{'$optionas': 'i'}};
			res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );

			q = {'x':{'$options':'i'}};
			res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );
		},
		"Should parse and match $exist true": function () {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$exists': true}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':'abc'}) );
			assert.ok( ! res.result.matches({'y':'AC'}) );
		},
		"Should parse and match $exists false": function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$exists':false}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':'abc'}) );
			assert.ok( res.result.matches({'y':'AC'}) );
		},
		"Should parse and match String $type": function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$type': 2 }};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x': 'abc'}) );
			assert.ok( ! res.result.matches({'x': 2}) );
		},
		"Should parse and match Number $type":function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$type':1}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':2}) );
			assert.ok( ! res.result.matches({'x': 'f'}) );
		},
		"Should parse and match null $type" : function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$type': 10}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':{}}) );
			assert.ok( ! res.result.matches({'x':5}) );
			assert.ok( res.result.matches({'x':null}) );
		},
		"Should parse but not match a type beyond typemax in $type": function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$type': 1000}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':5}) );
			assert.ok( ! res.result.matches({'x':'abc'}) );
		},
		"Should not parse a $type: Object":function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$type': {'x':1}}};

			var res = parser.parse( q );
			assert.strictEqual( res.code, 'BAD_VALUE' );
		},
		"Should parse and match a simple $or": function() {
			var parser = new MatchExpressionParser();
			var q = {'$or':[{'x':1},{'y':2}]};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':1}) );
			assert.ok( res.result.matches({'y':2}) );
			assert.ok( ! res.result.matches({'x':3}) );
			assert.ok( ! res.result.matches({'y':1}) );
		},
		"Should parse and match with nested $or s": function() {
			var parser = new MatchExpressionParser();
			var q = {'$or':[{'$or':[{'x':1},{'y':2}]}]};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':1}) );
			assert.ok( res.result.matches({'y':2}) );
			assert.ok( ! res.result.matches({'x':3}) );
			assert.ok( ! res.result.matches({'y':1}) );
		},
		"Should parse and match $and": function(){
			var parser = new MatchExpressionParser();
			var q = {'$and':[{'x':1},{'y':2}]};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':1}) );
			assert.ok( ! res.result.matches({'y':2}) );
			assert.ok( ! res.result.matches({'x':3}) );
			assert.ok( ! res.result.matches({'y':1}) );
			assert.ok( res.result.matches({'x':1, 'y':2}) );
			assert.ok( ! res.result.matches({'x':2, 'y':2}) );
		},
		"Should parse and match $nor": function() {
			var parser = new MatchExpressionParser();
			var q = {'$nor':[{'x':1},{'y':2}]};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':1}) );
			assert.ok( ! res.result.matches({'y':2}) );
			assert.ok( res.result.matches({'x':3}) );
			assert.ok( res.result.matches({'y':1}) );
		},
		"Should parse and match $not": function() {
			var parser = new MatchExpressionParser();
			var q = {'x':{'$not':{'$gt':5}}};

			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( res.result.matches({'x':2}) );
			assert.ok( ! res.result.matches({'x':8}) );
		},
		"Should parse $not $regex and match properly": function() {
			var parser = new MatchExpressionParser();
			var a = /abc/i;
			var q = {'x':{'$not': a}};
			var res = parser.parse( q );
			assert.strictEqual( res.code,'OK',res.description );
			assert.ok( ! res.result.matches({'x':'abc'}) );
			assert.ok( ! res.result.matches({'x':'ABC'}) );
			assert.ok( res.result.matches({'x':'AC'}) );
		}


	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

