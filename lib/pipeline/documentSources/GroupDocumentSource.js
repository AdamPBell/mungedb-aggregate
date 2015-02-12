"use strict";
var DocumentSource = require("./DocumentSource"),
	accumulators = require("../accumulators/"),
	Expression = require("../expressions/Expression"),
	ConstantExpression = require("../expressions/ConstantExpression"),
	FieldPathExpression = require("../expressions/FieldPathExpression"),
	Variables = require("../expressions/Variables"),
	VariablesIdGenerator = require("../expressions/VariablesIdGenerator"),
	VariablesParseState = require("../expressions/VariablesParseState"),
	async = require("neo-async");

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
	expCtx = !expCtx ? {} : expCtx;
	base.call(this, expCtx);

	this.populated = false;
	this.doingMerge = false;
	this.spilled = false;
	this.extSortAllowed = expCtx.extSortAllowed && !expCtx.inRouter;

	this.accumulatorFactories = [];
	this.currentAccumulators = [];
	this.groups = {}; // GroupsType Value -> Accumulators[]
	this.groupsKeys = []; // This is to faciliate easier look up of groups
	this.originalGroupsKeys = [];
	this.variables = null;
	this.fieldNames = [];
	this.idFieldNames = [];
	this.expressions = [];
	this.idExpressions = [];
	this.currentGroupsKeysIndex = 0;
}, klass = GroupDocumentSource, base = DocumentSource, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

klass.isSplittableDocumentSource = true;

klass.groupOps = {
	"$addToSet": accumulators.AddToSetAccumulator.create,
	"$avg": accumulators.AvgAccumulator.create,
	"$first": accumulators.FirstAccumulator.create,
	"$last": accumulators.LastAccumulator.create,
	"$max": accumulators.MinMaxAccumulator.createMax, // $min and $max have special constructors because they share base features
	"$min": accumulators.MinMaxAccumulator.createMin,
	"$push": accumulators.PushAccumulator.create,
	"$sum": accumulators.SumAccumulator.create,
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
 * Gets the next document or null if none
 *
 * @method getNext
 * @return {Object}
 **/
proto.getNext = function getNext(callback) {
	if (!callback) throw new Error(this.getSourceName() + " #getNext() requires callback.");
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
			// NOTE: Skipped the spilled functionality
			if (self.spilled) {
				throw new Error("Spilled is not implemented.");
			} else {
				if(self.currentGroupsKeysIndex === self.groupsKeys.length) {
					return next(null, null);
				}

				var out;
				try {
					var id = self.originalGroupsKeys[self.currentGroupsKeysIndex],
						stringifiedId = self.groupsKeys[self.currentGroupsKeysIndex],
						accumulators = self.groups[stringifiedId];

					out = self.makeDocument(id, accumulators, self.expCtx.inShard);

					if(++self.currentGroupsKeysIndex === self.groupsKeys.length) {
						self.dispose();
					}
				} catch (ex) {
					return next(ex);
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
	//NOTE: Skipped 'freeing' our resources; at best we could remove some refs

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
	var self = this,
		insides = {};

	// add the _id
	if (self.idFieldNames.length === 0) {
		if (self.idExpressions.length !== 1) throw new Error("Should only have one _id field");
		insides._id = self.idExpressions[0].serialize(explain);
	} else {
		if (self.idExpressions.length !== self.idFieldNames.length)
			throw new Error("Should have the same number of idExpressions and idFieldNames.");

		var md = {};
		self.idExpressions.forEach(function(expression, i) {
			md[self.idFieldNames[i]] = expression.serialize(explain);
		});
		insides._id = md;
	}

	//add the remaining fields
	var aFacs = self.accumulatorFactories,
		aFacLen = aFacs.length;

	for(var i=0; i < aFacLen; i++) {
		var aFac = new aFacs[i](),
			serialExpression = self.expressions[i].serialize(explain), //Get the accumulator's expression
			serialAccumulator = {}; //Where we'll put the expression
		serialAccumulator[aFac.getOpName()] = serialExpression;
		insides[self.fieldNames[i]] = serialAccumulator;
	}

	var serialSource = {};
	serialSource[self.getSourceName()] = insides;
	return serialSource;
};

/**
 * Creates a GroupDocumentSource from the given elem
 *
 * @method	createFromJson
 * @param elem {Object} The group specification object; the right hand side of the $group
 **/
klass.createFromJson = function createFromJson(elem, expCtx) { //jshint maxcomplexity:17
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

			} else if (groupFieldName === "$doingMerge" && groupField) {
				throw new Error("17030 $doingMerge should be true if present");
			} else {
				/*
					Treat as a projection field with the additional ability to
					add aggregation operators.
				*/
				if (groupFieldName.indexOf(".") !== -1)
					throw new Error("the group aggregate field name '" + groupFieldName +
						"' cannot be used because $group's field names cannot contain '.'; uassert code 16414");
				if (groupFieldName[0] === "$")
					throw new Error("the group aggregate field name '" +
						groupFieldName + "' cannot be an operator name; uassert 15950");
				if (group._getTypeStr(groupFieldName) === "Object")
					throw new Error("the group aggregate field '" + groupFieldName +
						"' must be defined as an expression inside an object; uassert 15951");

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
				if (subElementCount !== 1)
					throw new Error("the computed aggregate '" +
						groupFieldName + "' must specify exactly one operator; uassert code 15954");
			}
		}
	}

	if (!idSet) throw new Error("15955 a group specification must include an _id");

	group.variables = new Variables(idGenerator.getIdCount());

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
			return input !== null;
		},
		function(cb) {
			async.setImmediate(function() {
				self.source.getNext(function(err, doc) {
					if(err) return cb(err);
					if(doc === null) {
						input = doc;
						return cb(); //Need to stop now, no new input
					}
					try {
						input = doc;
						self.variables.setRoot(input);

						/* get the _id value */
						var id = self.computeId(self.variables);

						if(undefined === id) id = null;

						var groupKey = JSON.stringify(id),
							group = self.groups[groupKey];

						if(!group) {
							self.originalGroupsKeys.push(id);
							self.groupsKeys.push(groupKey);
							group = [];
							self.groups[groupKey] = group;
							// Add the accumulators
							for(var afi = 0; afi<self.accumulatorFactories.length; afi++) {
								group.push(new self.accumulatorFactories[afi]());
							}
						}
						//NOTE: Skipped memory usage stuff for case when group already existed

						if(numAccumulators !== group.length) {
							throw new Error("Group must have one of each accumulator");
						}

						//NOTE: passing the input to each accumulator
						for(var gi=0; gi<group.length; gi++) {
							group[gi].process(self.expressions[gi].evaluate(self.variables, self.doingMerge));
						}

						// We are done with the ROOT document so release it.
						self.variables.clearRoot();

						//NOTE: Skipped the part about sorted files
					} catch (ex) {
						return cb(ex);
					}
					return cb();
				});
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

	return DocumentSource.GetDepsReturn.EXHAUSTIVE_ALL;
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
		if (val === undefined) {
			out[fieldName] = null;
		} else {
			out[fieldName] = val;
		}
	});

	return out;
};

/**
 * Computes the internal representation of the group key.
 *
 * @method computeId
 * @param vars a VariablesParseState
 * @return vals
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
 *
 * @method expandId
 * @param val
 * @return document representing an id
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
	val.forEach(function(v, i) {
		doc[self.idFieldNames[i]] = v;
	});

	return doc;
};

/**
 * Parses the raw id expression into _idExpressions and possibly _idFieldNames.
 *
 * @method parseIdExpression
 * @param groupField {Object} The object with the spec
 */
proto.parseIdExpression = function parseIdExpression(groupField, vps) {
	var self = this;
	if (self._getTypeStr(groupField) === "Object" && Object.keys(groupField).length !== 0) {
		// {_id: {}} is treated as grouping on a constant, not an expression

		var idKeyObj = groupField;
		if (Object.keys(idKeyObj)[0][0] === "$") {
			var objCtx = new Expression.ObjectCtx({});
			self.idExpressions.push(Expression.parseObject(idKeyObj, objCtx, vps));
		} else {
			Object.keys(idKeyObj).forEach(function(key, i) {
				var field = {}; //idKeyObj[key];
				field[key] = idKeyObj[key];
				self.idFieldNames.push(key);
				self.idExpressions.push(Expression.parseOperand(field[key], vps));
			});
		}
	} else if (self._getTypeStr(groupField) === "string" && groupField[0] === "$") {
		self.idExpressions.push(FieldPathExpression.parse(groupField, vps));
	} else {
		self.idExpressions.push(ConstantExpression.create(groupField));
	}
};

/**
 * Get the type of something. Handles objects specially to return their true type; i.e. their constructor
 *
 * @method _getTypeStr
 * @param obj {Object} The object to get the type of
 * @return {String} The type of the object as a string
 **/
proto._getTypeStr = function _getTypeStr(obj) {
	var typeofStr = typeof obj,
		typeStr = (typeofStr === "object" && obj !== null) ? obj.constructor.name : typeofStr;
	return typeStr;
};

proto.getShardSource = function getShardSource() {
	return this;
};

proto.getMergeSource = function getMergeSource() {
	var self = this,
		merger = klass.create(this.expCtx);

	var idGenerator = new VariablesIdGenerator(),
		vps = new VariablesParseState(idGenerator);

	merger.idExpressions.push(FieldPathExpression.parse("$$ROOT._id", vps));

	for (var i = 0; i < self.fieldNames.length; i++) {
		merger.addAccumulator(
			self.fieldNames[i], self.accumulatorFactories[i],
			FieldPathExpression.create("$$ROOT." + self.fieldNames[i], vps)
		);
	}

	return merger;
};
