"use strict";

var Runner = require('./Runner');

/**
 * This class is an array runner used to run a pipeline against a static array of data
 * @param	{Array}	items	The array source of the data
 **/
var klass = module.exports = function ArrayRunner(array){
	base.call(this);
	
	if (!array || array.constructor !== Array ) throw new Error('Array runner requires an array');
	this._array = array;
	this._position = 0;
	this._state = Runner.RunnerState.RUNNER_ADVANCED;
}, base = Runner, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

proto.getNext = function getNext(callback) {
	var obj, err;
	try {
		if (this._state === Runner.RunnerState.RUNNER_ADVANCED) {
			if (this._position < this._array.length){
				obj = this._array[this._position++];
			} else {
				this._state = Runner.RunnerState.RUNNER_EOF;
			}
		}
	} catch (ex) {
		err = ex;
		this._state = Runner.RunnerState.RUNNER_ERROR;
	}
	
	return callback(err, obj, this._state);
};

proto.saveState = function saveState() {
	//nothing to do here
};

proto.restoreState = function restoreState() {
	//nothing to do here
};

proto.getInfo = function getInfo(explain) {
	if (explain){
		return {
			type: this.constructor.name,
			nDocs: this._array.length,
			position: this._position,
			state: this._state
		};
	}
	return undefined;
};

proto.reset = function reset(){
	this._array = [];
	this._position = 0;
	this._state = Runner.RunnerState.RUNNER_DEAD;
}
