"use strict";
var DocumentSource = require("./DocumentSource"),
	Accumulators = require("../accumulators/"),
	Document = require("../Document"),
	Expression = require("../expressions/Expression"),
	ConstantExpression = require("../expressions/ConstantExpression"),
	FieldPathExpression = require("../expressions/FieldPathExpression"),
	Variables = require("../expressions/Variables"),
	VariablesIdGenerator = require("../expressions/VariablesIdGenerator"),
	VariablesParseState = require("../expressions/VariablesParseState"),
	async = require("async");

/**
 * A class for grouping documents together
 *
 * @class GroupDocumentSource
 * @namespace mungedb-aggregate.pipeline.documentSources
 * @module mungedb-aggregate
 * @constructor
 * @param [expCtx] {ExpressionContext}
 **/
var GroupDocumentSource = module.exports = function GroupDocumentSource(expCtx) {
	if (arguments.length > 1) throw new Error("up to one arg expected");
	base.call(this, expCtx);

	expCtx = !expCtx ? {} : expCtx;

	this.populated = false;
	this._doingMerge = false;
	this._spilled = false;
	this.extSortAllowed = expCtx.extSortAllowed && !expCtx.inRouter;
	this._maxMemoryUsageBytes = 100*1024*1024; // NOTE: This came from mongo

	this.accumulatorFactories = [];
	this.currentAccumulators = [];
	this.groups = {}; // GroupsType Value -> Accumulators[]
	this.groupsKeys = []; // This is to faciliate easier look up of groups
	this._variables = null;
	this.fieldNames = [];
	this.idFieldNames = [];
	this.expressions = [];
	this.idExpressions = [];
	this.currentGroupsKeysIndex = 0;

}, klass = GroupDocumentSource, base = DocumentSource, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// TODO: Do we need this?
klass.groupOps = {
	"$addToSet": Accumulators.AddToSet,
	"$avg": Accumulators.Avg,
	"$first": Accumulators.First,
	"$last": Accumulators.Last,
	"$max": Accumulators.MinMax.createMax, // $min and $max have special constructors because they share base features
	"$min": Accumulators.MinMax.createMin,
	"$push": Accumulators.Push,
	"$sum": Accumulators.Sum
};

klass.groupName = "$group";

/**
 * Factory for making GroupDocumentSources
 *
 * @method create
 * @static
 * @param [expCtx] {ExpressionContext}
 **/
klass.create = function create(expCtx) {
	return new GroupDocumentSource(expCtx);
};

/**
 * Factory for making GroupDocumentSources
 *
 * @method getSourceName
 * @return {GroupDocumentSource}
 **/
proto.getSourceName = function getSourceName() {
	return klass.groupName;
};

/**
 * Gets the next document or DocumentSource.EOF if none
 *
 * @method getNext
 * @return {Object}
 **/
proto.getNext = function getNext(callback) {
	if (!callback) throw new Error(this.getSourceName() + ' #getNext() requires callback.');
	if (this.expCtx.checkForInterrupt && this.expCtx.checkForInterrupt() === false)
		return callback(new Error("Interrupted"));

	var self = this;
	async.series([
		function(next) {
			if (!self.populated)
				self.populate(function(err) {
					return next(err);
				});
			else
				return next();
		},
		function(next) {
			if (self._spilled) {
				// NOTE: this got skipped before, work on it
				throw new error("Spilled isn't finished.")
				if (!self._sortIterator)
					return next(null, DocumentSource.EOF); // self is a boost::none in mongo

				numAccumulators = self.accumulatorFactories.length; // TODO: whaaat?
				for (var i = 0; i < numAccumulators; i++) {
					self.currentAccumulators[i].reset(); // prep accumulatorts for new group
				}

				self._currentId = self.firstPartOfNextGroup.first;
				while (self._currentId === _firstPartOfNextGroup.first) {
					// Inside of self loop, _firstPartOfNextGroup is the current data being processed.
					// At loop exit, it is the first value to be processed in the next group.

					switch (numAccumulators) { // mirrors switch in spill()
						case 0: // No Accumulators so no Values
							break;
						case 1: // single accumulators serialize as a single value
							self.currentAccumulators[0].process(_firstPartOfNextGroup.second, /*merging=*/true);
							break;
						default:
							var accumulatorStates = _firstPartOfNextGroup.second.getArray();
							for (var j = 0; j < numAccumulators; j++) {
								self.currentAccumulators[j].process(accumulatorStates[j], /*merging=*/true);
							}
							break;
					}

					if (!self._sorterIterator.more()) {
						dispose(); // what?
						break;
					}

					_firstPartOfNextGroup = _sorterIterator.next();
				}

				return next(null, makeDocument(_currentId, _currentAccumulators, self.expCtx.inShard));
			} else {
				if(self.currentGroupsKeysIndex === self.groupsKeys.length) {
					return next(null, DocumentSource.EOF);
				}

				var out = makeDocument(groupsIterator[0], groupsIterator[1], expCtx.inShard);

				if (++groupsIterator === groups.end)
					dispose();

				return next(null, out);

				if(self.currentGroupsKeysIndex === self.groupsKeys.length) {
					return next(null, DocumentSource.EOF);
				}

				var id = self.groupsKeys[self.currentGroupsKeysIndex],
					accumulators = self.groups[id],
					out = self.makeDocument(id, accumulators, expCtx.inShard);

				if(++self.currentGroupsKeysIndex === self.groupsKeys.length) {
					self.dispose();
				}

				return next(null, out);
			}
		}
	], function(err, results) {
		callback(err, results[1]);
	});
};

/**
 * Sets this source as apparently empty
 *
 * @method dispose
 **/
proto.dispose = function dispose() {
	//NOTE: Skipped 'freeing' our resources; at best we could remove some references to things, but our parent will probably forget us anyways!

	// make us look done
	this.currentGroupsKeysIndex = this.groupsKeys.length;

	// free our source's resources
	this.source.dispose();
};

/**
 * Optimizes the expressions in the group
 * @method optimize
 **/
proto.optimize = function optimize() {
	// TODO if all _idExpressions are ExpressionConstants after optimization, then we know there
	// will only be one group. We should take advantage of that to avoid going through the hash
	// table.
	var self = this;
	self.idExpressions.forEach(function(expression, i) {
		self.idExpressions[i] = expression.optimize();
	});

	self.expressions.forEach(function(expression, i) {
		self.expressions[i] = expression.optimize();
	});
};

/**
 * Create an object that represents the document source.  The object
 * will have a single field whose name is the source's name.
 *
 * @method	serialize
 * @param explain {Boolean} Create explain output
 **/
proto.serialize = function serialize(explain) {
	var insides = {};

	// add the _id
	if (this.idFieldNames.length === 0) {
		if (this.idExpressions.length !== 1) throw new error("Should only have one _id field");
		insides._id = this.idExpressions[0].serialize(explain);
	}

	//add the remaining fields
	var aFacs = this.accumulatorFactories,
		aFacLen = aFacs.length;

	for(var i=0; i < aFacLen; i++) {
		var aFac = aFacs[i](),
			serialExpression = this.expressions[i].serialize(explain), //Get the accumulator's expression
			serialAccumulator = {}; //Where we'll put the expression
		serialAccumulator[aFac.getOpName()] = serialExpression;
		insides[this.fieldNames[i]] = serialAccumulator;
	}

	var serialSource = {};
	serialSource[this.getSourceName()] = insides;
	return serialSource;
};

/**
 * Creates a GroupDocumentSource from the given elem
 *
 * @method	createFromJson
 * @param elem {Object} The group specification object; the right hand side of the $group
 **/
klass.createFromJson = function createFromJson(elem, expCtx) {
	if (!(elem instanceof Object && elem.constructor === Object)) throw new Error("a group's fields must be specified in an object");

	var group = GroupDocumentSource.create(expCtx),
		idSet = false;

	var groupObj = elem,
		idGenerator = new VariablesIdGenerator(),
		vps = new VariablesParseState(idGenerator);

	for (var groupFieldName in groupObj) {
		if (groupObj.hasOwnProperty(groupFieldName)) {
			var groupField = groupObj[groupFieldName];

			if (groupFieldName === "_id") {
				if(idSet) throw new Error("15948 a group's _id may only be specified once");

				group.parseIdExpression(groupField, vps);
				idSet = true;

			} else if (groupFieldName === '$doingMerge' && groupField) {
				throw new Error("17030 $doingMerge should be true if present");
			} else {
				/*
					Treat as a projection field with the additional ability to
					add aggregation operators.
				*/
				if (groupFieldName.indexOf(".") !== -1) throw new Error("16414 the group aggregate field name '" + groupFieldName + "' cannot contain '.'");
				if (groupFieldName[0] === "$") throw new Error("15950 the group aggregate field name '" + groupFieldName + "' cannot be an operator name");
				if (group._getTypeStr(groupFieldName) === "Object") throw new Error("15951 the group aggregate field '" + groupFieldName + "' must be defined as an expression inside an object");

				var subElementCount = 0;
				for (var subElementName in groupField) {
					if (groupField.hasOwnProperty(subElementName)) {
						var subElement = groupField[subElementName],
							op = klass.groupOps[subElementName];
						if (!op) throw new Error("15952 unknown group operator '" + subElementName + "'");

						var groupExpression,
							subElementTypeStr = group._getTypeStr(subElement);
						if (subElementTypeStr === "Object") {
							var subElementObjCtx = new Expression.ObjectCtx({isDocumentOk:true});
							groupExpression = Expression.parseObject(subElement, subElementObjCtx, vps);
						} else if (subElementTypeStr === "Array") {
							throw new Error("15953 aggregating group operators are unary (" + subElementName + ")");
						} else { /* assume its an atomic single operand */
							groupExpression = Expression.parseOperand(subElement, vps);
						}
						group.addAccumulator(groupFieldName, op, groupExpression);

						++subElementCount;
					}
				}
				if (subElementCount !== 1) throw new Error("15954 the computed aggregate '" + groupFieldName + "' must specify exactly one operator");
			}
		}
	}

	if (!idSet) throw new Error("15955 a group specification must include an _id");

	group._variables = new Variables(idGenerator.getIdCount());

	return group;
};

/**
 * Populates the GroupDocumentSource by grouping all of the input documents at once.
 *
 * @method populate
 * @param callback {Function} Required. callback(err) when done populating.
 * @async
 **/
proto.populate = function populate(callback) {
	var numAccumulators = this.accumulatorFactories.length;
	// NOTE: this is not in mongo, does it belong here?
	if(numAccumulators !== this.expressions.length) {
		callback(new Error("Must have equal number of accumulators and expressions"));
	}

	var input,
		self = this;
	async.whilst(
		function() {
			return input !== DocumentSource.EOF;
		},
		function(cb) {
			self.source.getNext(function(err, doc) {
				if(err) return cb(err);
				if(doc === DocumentSource.EOF) {
					input = doc;
					return cb(); //Need to stop now, no new input
				}

				input = doc;
				self._variables.setRoot(input);

				/* get the _id value */
				var id = self.idExpression.evaluate(self._variables);

				if(undefined === id) id = null;

				var groupKey = JSON.stringify(id),
					group = self.groups[JSON.stringify(id)];

				if(!group) {
					self.groupsKeys.push(groupKey);
					group = [];
					self.groups[groupKey] = group;
					// Add the accumulators
					for(var afi = 0; afi<self.accumulatorFactories.length; afi++) {
						group.push(self.accumulatorFactories[afi]());
					}
				}
				//NOTE: Skipped memory usage stuff for case when group already existed

				if(numAccumulators !== group.length) {
					throw new Error('Group must have one of each accumulator');
				}

				//NOTE: passing the input to each accumulator
				for(var gi=0; gi<group.length; gi++) {
					group[gi].process(self.expressions[gi].evaluate(self._variables, self._doingMerge));
				}

				// We are done with the ROOT document so release it.
				self._variables.clearRoot();

				//NOTE: Skipped the part about sorted files

				return cb();
			});
		},
		function(err) {
			if(err) return callback(err);

			self.populated = true;

			return callback();
		}
	);
};

/**
 * Get the dependencies of the group
 *
 * @method getDependencies
 * @param deps {Object} The
 * @return {DocumentSource.getDepsReturn} An enum value specifying that these dependencies are exhaustive
 * @async
 **/
proto.getDependencies = function getDependencies(deps) {
	var self = this;
	// add _id
	this.idExpressions.forEach(function(expression, i) {
		expression.addDependencies(deps);
	});
	// add the rest
	this.fieldNames.forEach(function (field, i) {
		self.expressions[i].addDependencies(deps);
	});

	return DocumentSource.GetDepsReturn.EXHAUSTIVE;
};

/**
 * Called internally only. Adds an accumulator for each matching group.
 *
 * @method addAccumulator
 * @param fieldName {String} The name of the field where the accumulated value will be placed
 * @param accumulatorFactory {Accumulator} The constructor for creating accumulators
 * @param epxression {Expression} The expression to be evaluated on incoming documents before they are accumulated
 **/
proto.addAccumulator = function addAccumulator(fieldName, accumulatorFactory, expression) {
	this.fieldNames.push(fieldName);
	this.accumulatorFactories.push(accumulatorFactory);
	this.expressions.push(expression);
};

/**
 * Makes a document with the given id and accumulators
 *
 * @method makeDocument
 * @param fieldName {String} The name of the field where the accumulated value will be placed
 * @param accums {Array} An array of accumulators
 * @param epxression {Expression} The expression to be evaluated on incoming documents before they are accumulated
 **/
proto.makeDocument = function makeDocument(id, accums, mergeableOutput) {
	var out = {};

	/* add the _id field */
	out._id = this.expandId(id);

	/* add the rest of the fields */
	this.fieldNames.forEach(function(fieldName, i) {
		var val = accums[i].getValue(mergeableOutput);
		if (!val) {
			out[fieldName] = null;
		} else {
			out[fieldName] = val;
		}
	});

	return out;
};

/**
 * Computes the internal representation of the group key.
 */
proto.computeId = function computeId(vars) {
	var self = this;
	// If only one expression return result directly
	if (self.idExpressions.length === 1)
		return self.idExpressions[0].evaluate(vars); // NOTE: self will probably need to be async soon

	// Multiple expressions get results wrapped in an array
	var vals = [];
	self.idExpressions.forEach(function(expression, i) {
		vals.push(expression.evaluate(vars));
	});

	return vals;
};

/**
 * Converts the internal representation of the group key to the _id shape specified by the
 * user.
 */
proto.expandId = function expandId(val) {
	var self = this;
	// _id doesn't get wrapped in a document
	if (self.idFieldNames.length === 0)
		return val;

	var doc = {};

	// _id is a single-field document containing val
	if (self.idFieldNames.length === 1) {
		doc[self.idFieldNames[0]] = val;
		return doc;
	}

	// _id is a multi-field document containing the elements of val
	vals.forEach(function(val, i) {
		doc[self.idFieldNames[i]] = val;
	});

	return doc;
};

proto.parseIdExpression = function parseIdExpression(groupField, vps) {
	var self = this;
	if (self._getTypeStr(groupField) === 'Object' && groupField !== {}) {
		// {_id: {}} is treated as grouping on a constant, not an expression

		var idKeyObj = groupField;
		if (Object.keys(idKeyObj)[0] == '$') {
			self.idExpressions.push(Expression.parseObject(idKeyObj, {}, vps));
		} else {
			Object.keys(idKeyObj).forEach(function(key, i) {
				var field = {}; //idKeyObj[key];
				field[key] = idKeyObj[key];
				self.idFieldNames.push(key);
				self.idExpressions.push(Expression.parseOperand(field, vps));
			});
		}
	} else if (self._getTypeStr(groupField) === 'string' && groupField[0] === '$') {
		self.idExpressions.push(FieldPathExpression.parse(groupField, vps));
	} else {
		self.idExpressions.push(ConstantExpression.create(groupField));
	}
};

/**
 * Get the type of something. Handles objects specially to return their true type; i.e. their constructor
 *
 * @method populate
 * @param obj {Object} The object to get the type of
 * @return {String} The type of the object as a string
 * @async
 **/
proto._getTypeStr = function _getTypeStr(obj) {
	var typeofStr = typeof obj,
		typeStr = (typeofStr == "object" && obj !== null) ? obj.constructor.name : typeofStr;
	return typeStr;
};
