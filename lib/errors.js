"use strict";

/**
 * This file defines valid error codes used by mongo
 * mongo/base/error_codes.err
 */
module.exports = {

	// Error codes
	ErrorCodes: { //TODO: out of date and perhaps should only bring over what we use
		OK                           : "OK"                           ,
		INTERNAL_ERROR               : "INTERNAL_ERROR"               ,
		BAD_VALUE                    : "BAD_VALUE"                    ,
		DUPLICATE_KEY                : "DUPLICATE_KEY"                ,
		NO_SUCH_KEY                  : "NO_SUCH_KEY"                  ,
		GRAPH_CONTAINS_CYCLE         : "GRAPH_CONTAINS_CYCLE"         ,
		HOST_UNREACHABLE             : "HOST_UNREACHABLE"             ,
		HOST_NOT_FOUND               : "HOST_NOT_FOUND"               ,
		UNKNOWN_ERROR                : "UNKNOWN_ERROR"                ,
		FAILED_TO_PARSE              : "FAILED_TO_PARSE"              ,
		CANNOT_MUTATE_OBJECT         : "CANNOT_MUTATE_OBJECT"         ,
		USER_NOT_FOUND               : "USER_NOT_FOUND"               ,
		UNSUPPORTED_FORMAT           : "UNSUPPORTED_FORMAT"           ,
		UNAUTHORIZED                 : "UNAUTHORIZED"                 ,
		TYPE_MISMATCH                : "TYPE_MISMATCH"                ,
		OVERFLOW                     : "OVERFLOW"                     ,
		INVALID_LENGTH               : "INVALID_LENGTH"               ,
		PROTOCOL_ERROR               : "PROTOCOL_ERROR"               ,
		AUTHENTICATION_FAILED        : "AUTHENTICATION_FAILED"        ,
		CANNOT_REUSE_OBJECT          : "CANNOT_REUSE_OBJECT"          ,
		ILLEGAL_OPERATION            : "ILLEGAL_OPERATION"            ,
		EMPTY_ARRAY_OPERATION        : "EMPTY_ARRAY_OPERATION"        ,
		INVALID_B_S_O_N              : "INVALID_B_S_O_N"              ,
		ALREADY_INITIALIZED          : "ALREADY_INITIALIZED"          ,
		LOCK_TIMEOUT                 : "LOCK_TIMEOUT"                 ,
		REMOTE_VALIDATION_ERROR      : "REMOTE_VALIDATION_ERROR"      ,
		NAMESPACE_NOT_FOUND          : "NAMESPACE_NOT_FOUND"          ,
		INDEX_NOT_FOUND              : "INDEX_NOT_FOUND"              ,
		PATH_NOT_VIABLE              : "PATH_NOT_VIABLE"              ,
		NON_EXISTENT_PATH            : "NON_EXISTENT_PATH"            ,
		INVALID_PATH                 : "INVALID_PATH"                 ,
		ROLE_NOT_FOUND               : "ROLE_NOT_FOUND"               ,
		ROLES_NOT_RELATED            : "ROLES_NOT_RELATED"            ,
		PRIVILEGE_NOT_FOUND          : "PRIVILEGE_NOT_FOUND"          ,
		CANNOT_BACKFILL_ARRAY        : "CANNOT_BACKFILL_ARRAY"        ,
		USER_MODIFICATION_FAILED     : "USER_MODIFICATION_FAILED"     ,
		REMOTE_CHANGE_DETECTED       : "REMOTE_CHANGE_DETECTED"       ,
		FILE_RENAME_FAILED           : "FILE_RENAME_FAILED"           ,
		FILE_NOT_OPEN                : "FILE_NOT_OPEN"                ,
		FILE_STREAM_FAILED           : "FILE_STREAM_FAILED"           ,
		CONFLICTING_UPDATE_OPERATORS : "CONFLICTING_UPDATE_OPERATORS" ,
		FILE_ALREADY_OPEN            : "FILE_ALREADY_OPEN"            ,
		LOG_WRITE_FAILED             : "LOG_WRITE_FAILED"             ,
		CURSOR_NOT_FOUND             : "CURSOR_NOT_FOUND"             ,
		KEY_NOT_FOUND                : "KEY_NOT_FOUND"                ,
	},

	// Classes of errors
	ErrorClass: { //TODO: out of date and perhaps should only bring over what we use
		NETWORK_ERROR: ["HOST_UNREACHABLE", "HOST_NOT_FOUND"],
	},

};
