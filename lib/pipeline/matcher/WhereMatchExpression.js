"use strict";

var WhereMatchExpression = module.exports = function WhereMatchExpression( txn ){
	this._txn = txn;
	this._matchType = 'MATCH_WHERE';
}, klass = WhereMatchExpression, base =  Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var errors = require("../../Errors.js"),
	ErrorCodes = errors.ErrorCodes,
	MatchExpression = require("./MatchExpression.js"),
	MatchExpressionParser = require("./MatchExpressionParser.js");

proto._txn = undefined;
proto._func = 0;
proto._dbName = undefined;
proto._ns = undefined;
proto._code = undefined;
proto._userScope = undefined;
proto._scope = undefined;

/**
 *
 * Initialize the necessary items
 * @method init
 * @param dbName
 * @param theCode
 * @param scope
 *
 */
proto.init = function init(dbName, theCode, scope) {
	if ( dbName === undefined ) {
		return {'code':'BAD_VALUE', 'description':'ns for $where cannot be empty'};
	}
	if ( theCode === undefined ) {
		return {'code':'BAD_VALUE', 'description':'code for $where cannot be empty'};
	}

	this._dbName = dbName;
	this._code = theCode;

	// TODO: Not implementing for now.

	this._userScope = scope.getOwned();
	var userToken = this.getAuthorizationSession().getAuthenticatedUserNamesToken();
	this._scope = this.globalScriptEngine.getPooledScope(this._txn, this._dbName, "where" + userToken);
	this._func = this._scope.createFunction( this._code.c_str() );
	if ( !this._func) {
		return {'code':'BAD_VALUE', 'description':'$where compile error'};
	}

	return {'code':'OK'};
};


/**
 *
 * Matches the necessary items
 * @method matches
 * @param doc
 * @param details
 *
 */
proto.matches = function matches(doc, details) {
	var obj = JSON.stringify(doc);

	if ( this._userScope === undefined ){
		this._scope.init( this._userScope);
	}

	this._scope.obj = obj;
	this._scope.fullObject = true;

	var err = this._scope.invoke( this._func, 0, obj, 1000 * 60, false);
	if ( err == -3) { // INVOKE_ERROR
		var ss = "error on invocation of $where funciton:\n" + this._scope.getError();
		throw new Error(ss);
	} else if ( err !== 0 ) {
		throw new Error("unknown error in invocation of $where function");
	}

	return this._scope.__returnValue !== 0;
};


/**
 *
 * Call the debugString method
 * @method toString
 *
 */
proto.debugString = function debugString(level){
	return this._debugAddSpace( level ) + "$where\n" +
			this._debugAddSpace( level + 1 ) + "dbName: " + this._dbName + "\n" +
			this._debugAddSpace( level + 1 ) + "code: " + this._code + "\n" +
			this._debugAddSpace( level + 1 ) + "scope: " + this._userScope + "\n";
};

/**
 *
 * Return evaluation of comparison result of equivalence.
 * @method equivalent
 * @param level
 *
 */
proto.equivalent = function equivalent(other){

	if ( other._matchType != 'MATCH_WHERE' ) {
		return false;
	}
	return this._ns === other._ns &&
			this._code === other._code &&
			this._userScope === other._userScope;
};


proto.expressionParserWhereCallbackReal = function expressionParserWhereCallbackReal(where){
	if ( !this.haveClient() ){
		return {'code':'NO_CLIENT_CONTEXT', 'description':'no context in $where parsing'};
	}

	var context = this.cc().getContext();
	if ( !context ) {
		return {'code':'BAD_VALUE', 'description':'no ns in $where parsing'};
	}

	if ( !this.globalScrioptEngine ) {
		return {'code':'BAD_VALUE', 'description':'no globalScriptEngine in $where parsing'};
	}

	var exp = new WhereMatchExpression();
	if ( typeof where === 'string' ){
		var s = this.exp.init( this._ns, where, {} );
		if ( !s.isOK() ) {
			return this.StatusWithMatchExpression( s );
		}
		return this.StatusWithMatchExpression( this.exp.release() );
	}
	return this.StatusWithMatchExpression( {'code':'BAD_VALUE', 'description':'$where got bad type'} );
};

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto._debugAddSpace = function _debugAddSpace(level){
	return new Array( level + 1).join("    ");
};

/**
 *
 * Reset and return the _tagData property
 * @method resetTag
 *
 */
proto.resetTag = function resetTag(){
	this.setTag(null);
};

/**
 *
 * Check if the input element matches
 * @method matchesSingleElement
 * @param e
 *
 */
proto.matchesSingleElement = function matchesSingleElement(e) {
	return false;
};

/**
 *
 * clone this instance to a new one
 * @method shallowClone
 *
 */
proto.shallowClone = function shallowClone(){
	var e = new WhereMatchExpression(this._txn);
	e.init(this._dbName, this._code, this._userScope);
	if ( this.getTag() ){
		e.setTag(this.getTag().clone());
	}
	return e;
};


/*
TODO: MONGO_INITIALIZER is not impelemented.
*/
