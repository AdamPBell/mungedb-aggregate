"use strict";

var Runner = require('./Runner'),
	DocumentSource = require('../pipeline/documentSources/DocumentSource');

/**
 * This class is a runner used to wrap a document source
 * @param	{Array}	items	The array source of the data
 **/
var klass = module.exports = function DocumentSourceRunner(docSrc, pipeline){
	base.call(this);

	if (!docSrc || !(docSrc instanceof DocumentSource) ) throw new Error('DocumentSource runner requires a DocumentSource');
	if (pipeline && pipeline.constructor != Array ) throw new Error('DocumentSource runner requires pipeline to be an Array');
	
	this._docSrc = docSrc;
	this._pipeline = pipeline || [];
	
	while (this._pipeline.length && this._docSrc.coalesce(this._pipeline[0])) {
		this._pipeline.shift();
	}
	
	this._state = Runner.RunnerState.RUNNER_ADVANCED;
}, base = Runner, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

/**
 * Get the next result from the array.
 * 
 * @method getNext
 * @param [callback] {Function}
 */
proto.getNext = function getNext(callback) {
	var self = this;
	if (self._state === Runner.RunnerState.RUNNER_ADVANCED) {
		return self._docSrc.getNext(function (err, obj){
			if (err){
				self._state = Runner.RunnerState.RUNNER_ERROR;
			}
			if (obj === null){
				self._state = Runner.RunnerState.RUNNER_EOF;
			}
			return callback(err, obj, self._state);
		});
	}
	return callback(null, null, self._state);
};

/**
 * Save any state required to yield.
 * 
 * @method saveState
 */
proto.saveState = function saveState() {
	//nothing to do here
};

/**
 * Restore saved state, possibly after a yield.  Return true if the runner is OK, false if
 * it was killed.
 * 
 * @method restoreState
 */
proto.restoreState = function restoreState() {
	//nothing to do here
};

/**
 * Returns a description of the Runner
 * 
 * @method getInfo
 * @param [explain]
 * @param [planInfo]
 */
proto.getInfo = function getInfo(explain) {
	if (explain){
		return {
			type: this.constructor.name,
			docSrc: this._docSrc.serialize(explain),
			state: this._state
		};
	}
	return undefined;
};

/**
 * dispose of the Runner.
 * 
 * @method reset
 */
proto.reset = function reset(){
	this._docSrc.dispose();
	this._state = Runner.RunnerState.RUNNER_DEAD;
};
