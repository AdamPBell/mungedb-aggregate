"use strict";
var assert = require("assert"),
	WhereMatchExpression = require("../../../../lib/pipeline/matcher/WhereMatchExpression");

// Mongo supplied no integration tests with WhereMatchExpression
module.exports = {
	"WhereMatchExpression": {
		"should run series of tests": function (){
			var e = new WhereMatchExpression();

			// MOCK UP MISSING INTEGRATION PIECES
			// TODO: After all the missing elements are implemented, 
			// most mocks will not be necessary.
			e._userScope = {};
			e._scope= {};
			e._ns = "ns";
			e._code = "code";

			e._scope.invoke = function(){};
			e.getAuthorizationSession = function(){
				var result = {};
				result.getAuthenticatedUserNamesToken = function(){};
				return result;
			};
			e.getAuthorizationSession.getAuthenticatedUserNamesToken = function(){};
			e.globalScriptEngine = {};
			e.globalScriptEngine.getPooledScope = function(txn, dbName, userToken){
				var scope = {};
				scope.createFunction = function( code ){
					var result = {};
					return result;
				};
				scope.obj = {}
				scope.fullObject = false;
				scope.init = function( scope){
					return {};
				}
				scope.invoke = function( func, it, obj, time, bl){
					return 0;
				}
				return scope;
			};

			var theCode = {};
			theCode.c_str = function(){};

			var scope = {};
			scope.getOwned = function(){ return {};};
			var dbName = "eagle6";

			// Assert we can create
			var s = e.init(dbName,theCode,scope);
			assert.strictEqual(s.code, 'OK');

			// Assert we get debugString
			var debugString = e.debugString(0);
			assert.strictEqual(debugString.split("\n")[1], '    dbName: eagle6');

			// Assert equivalent
			var result = e.equivalent("NotEQ");
			assert.strictEqual(result, false);

			// Assert equivalent of unknown type
			var other = {};
			other._matchType = "SOME_UNKNOWN_TYPE";
			var result = e.equivalent(other);
			assert.strictEqual(result, false);

			// Assert equivalent of correct type but return false because objects don't match
			var other = {};
			other._matchType = "MATCH_WHERE";
			var result = e.equivalent(other);
			assert.strictEqual(result, false);

			// Assert equivalent of correct type
			var result = e.equivalent(e);
			assert.strictEqual(result, true);
		}
	}
};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

