"use strict";
var assert = require("assert"),
	XRegExp = require("xregexp").XRegExp,
	RegexMatchExpression = require("../../../../lib/pipeline/matcher/RegexMatchExpression"),
	MatchDetails = require("../../../../lib/pipeline/matcher/MatchDetails");


module.exports = {
	"RegexMatchExpression": {

		"should match an exact element": function(){
			var match = {"a":"b"},
				notMatch = {"a":"c"};
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("", "b", "").code, 'OK');
			
			assert(regex.matchesSingleElement(match.a));
			assert(!regex.matchesSingleElement(notMatch.a));
		},
		"should error if the pattern is too large": function(){
			var tooLargePattern = "";
			for (var i = 0; i<32765; i++){tooLargePattern += '3';}
			var regex = new RegexMatchExpression();
			assert(regex.init("a", tooLargePattern, "").code !== 'OK');
		},
		"should match an element with a simple prefix": function(){
			var match = {"x":"abc"},
				notMatch = {"x":"adz"};
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("", "^ab", "").code, 'OK');
			
			assert(regex.matchesSingleElement(match.x));
			assert(!regex.matchesSingleElement(notMatch.x));
		},
		"should match an element case sensitive": function(){
			var match = {"x":"abc"},
				notMatch = {"x":"ABC"};
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("", "abc", "").code, 'OK');
			
			assert(regex.matchesSingleElement(match.x));
			assert(!regex.matchesSingleElement(notMatch.x));
		},
		"should match an element case insensitive": function(){
			var match = {"x":"abc"},
				matchUppercase = {"x":"ABC"},
				notMatch = {"x":"adz"};
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("", "abc", "i").code, 'OK');
			
			assert(regex.matchesSingleElement(match.x));
			assert(regex.matchesSingleElement(matchUppercase.x));
			assert(!regex.matchesSingleElement(notMatch.x));
		},
		"should match an element multiline off": function(){
			var match = {"x":"az"},
				notMatch = {"x":"\naz"};
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("", "^a", "").code, 'OK');
			
			assert(regex.matchesSingleElement(match.x));
			assert(!regex.matchesSingleElement(notMatch.x));
		},
		"should match an element multiline on": function(){
			var match = {"x":"az"},
				matchMultiline = {"x":"\naz"},
				notMatch = {"x":"\n\n"};
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("", "^a", "m").code, 'OK');
			
			assert(regex.matchesSingleElement(match.x));
			assert(regex.matchesSingleElement(matchMultiline.x));
			assert(!regex.matchesSingleElement(notMatch.x));
		},
		"should match an element with extended off": function(){
			var match = {"x":"a b"},
				notMatch = {"x":"ab"};
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("", "a b", "").code, 'OK');
			
			assert(regex.matchesSingleElement(match.x));
			assert(!regex.matchesSingleElement(notMatch.x));
		},
		"should match an element with extended on": function(){
			var match = {"x":"ab"},
				notMatch = {"x":"a b"};
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("", "a b", "x").code, 'OK');
			
			assert(regex.matchesSingleElement(match.x));
			assert(!regex.matchesSingleElement(notMatch.x));
		},
		"should match an element with dot matches all off": function(){
			var match = {"x":"a b"},
				notMatch = {"x":"a\nb"};
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("", "a.b", "").code, 'OK');
			
			assert(regex.matchesSingleElement(match.x));
			assert(!regex.matchesSingleElement(notMatch.x));
		},
		"should match an element with dot matches all on": function(){
			var match = {"x":"a b"},
				matchDotAll = {"x":"a\nb"},
				notMatch = {"x":"ab"};
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("", "a.b", "s").code, 'OK');
			
			assert(regex.matchesSingleElement(match.x));
			assert(regex.matchesSingleElement(matchDotAll.x));
			assert(!regex.matchesSingleElement(notMatch.x));
		},
		"should match an element with multiple flags": function(){
			var match = {"x":"\na\nb"};
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("", "^a.b", "ms").code, 'OK');
			
			assert(regex.matchesSingleElement(match.x));
		},
		"should match an element with type regex": function(){
			var match = {"x":new XRegExp('yz', 'i')},
				notMatchPattern = {"x":new XRegExp('r', 'i')},
				notMatchFlags = {"x":new XRegExp('yz', 's')};
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("", "yz", "i").code, 'OK');
			
			assert(regex.matchesSingleElement(match.x));
			assert(!regex.matchesSingleElement(notMatchPattern.x));
			assert(!regex.matchesSingleElement(notMatchFlags.x));
		},
	
//skipped as we don't support symbols yet	
/*
    TEST( RegexMatchExpression, MatchesElementSymbolType ) {
        BSONObj match = BSONObjBuilder().appendSymbol( "x", "yz" ).obj();
        BSONObj notMatch = BSONObjBuilder().appendSymbol( "x", "gg" ).obj();
        RegexMatchExpression regex;
        ASSERT( regex.init( "", "yz", "" ).isOK() );
        ASSERT( regex.matchesSingleElement( match.firstElement() ) );
        ASSERT( !regex.matchesSingleElement( notMatch.firstElement() ) );
    }
*/

		"should not match an element with the wrong type": function(){
			var notMatchInt = {"x":1},
				notMatchBool = {"x":true};
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("", "1", "").code, 'OK');
			
			assert(!regex.matchesSingleElement(notMatchInt.x));
			assert(!regex.matchesSingleElement(notMatchBool.x));
		},

		"should match an element that is Utf8": function(){
			var matches = {"x":"\u03A9"};
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("", "^.*", "").code, 'OK');
			
			assert(regex.matchesSingleElement(matches.x));
		},
		
		"should match an element that is scalar": function(){
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("a", "b", "").code, 'OK');
			
			assert(regex.matches({"a":"b"}));
			assert(!regex.matches({"a":"c"}));
		},
		"should match an array value": function(){
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("a", "b", "").code, 'OK');
			
			assert(regex.matches({"a":["c","b"]}));
			assert(!regex.matches({"a":["d","c"]}));
		},
		"should match null": function(){
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("a", "b", "").code, 'OK');
			
			assert(!regex.matches({}));
			assert(!regex.matches({"a":null}));
		},
		"should match element keys": function(){
			var regex = new RegexMatchExpression();
			assert.strictEqual(regex.init("a", "b", "").code, 'OK');
			var details = new MatchDetails();
			details.requestElemMatchKey();
			
			assert(!regex.matches({"a":"c"}, details));
			assert(!details.hasElemMatchKey());
			assert(regex.matches({"a":"b"}, details));
			assert(!details.hasElemMatchKey());
			assert(regex.matches({"a":["c", "b"]}, details));
			assert(details.hasElemMatchKey());
			assert.strictEqual(details.elemMatchKey(), "1");
		},
		"should determine equivalency": function(){
			var r1 = new RegexMatchExpression(),
				r2 = new RegexMatchExpression(),
				r3 = new RegexMatchExpression(),
				r4 = new RegexMatchExpression();
			assert.strictEqual(r1.init("a", "b", "").code, 'OK');
			assert.strictEqual(r2.init("a", "b", "x").code, 'OK');
			assert.strictEqual(r3.init("a", "c", "").code, 'OK');
			assert.strictEqual(r4.init("b", "b", "").code, 'OK');
			
			assert(r1.equivalent(r1));
			assert(!r1.equivalent(r2));
			assert(!r1.equivalent(r3));
			assert(!r1.equivalent(r4));
		},

	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
