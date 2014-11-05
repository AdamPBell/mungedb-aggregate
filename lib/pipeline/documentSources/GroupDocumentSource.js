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

	this.populated = false;
	this.idExpression = null;
	this.groups = {}; // GroupsType Value -> Accumulators[]
	this.groupsKeys = []; // This is to faciliate easier look up of groups
	this.originalGroupsKeys = []; // This stores the original group key un-hashed/stringified/whatever
	this._variables = null;
	this.fieldNames = [];
	this.accumulatorFactories = [];
	this.expressions = [];
	this.currentDocument = null;
	this.currentGroupsKeysIndex = 0;

}, klass = GroupDocumentSource, base = DocumentSource, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

klass.groupOps = {
	"$addToSet": Accumulators.AddToSetAccumulator.create,
	"$avg": Accumulators.AvgAccumulator.create,
	"$first": Accumulators.FirstAccumulator.create,
	"$last": Accumulators.LastAccumulator.create,
	"$max": Accumulators.MinMaxAccumulator.createMax, // $min and $max have special constructors because they share base features
	"$min": Accumulators.MinMaxAccumulator.createMin,
	"$push": Accumulators.PushAccumulator.create,
	"$sum": Accumulators.SumAccumulator.create,
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
			if(Object.keys(self.groups).length === 0) {
				return next(null, DocumentSource.EOF);
			}

			//Note: Skipped the spilled logic

			if(self.currentGroupsKeysIndex === self.groupsKeys.length) {
				return next(null, DocumentSource.EOF);
			}

			var id = self.groupsKeys[self.currentGroupsKeysIndex],
				accumulators = self.groups[id],
				out = self.makeDocument(id, accumulators /*,mergeableOutput*/);

			if(++self.currentGroupsKeysIndex === self.groupsKeys.length) {
				self.dispose();
			}

			return next(null, out);
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
	var self = this;
	self.idExpression = self.idExpression.optimize();
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
	insides._id = this.idExpression.serialize(explain);

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

				if (groupField instanceof Object && groupField.constructor === Object) {
					/*
						Use the projection-like set of field paths to create the
						group-by key.
					*/
					var objCtx = new Expression.ObjectCtx({isDocumentOk:true});
					group.setIdExpression(Expression.parseObject(groupField, objCtx, vps));
					idSet = true;

				} else if (typeof groupField === "string") {
					if (groupField[0] === "$") {
						group.setIdExpression(FieldPathExpression.parse(groupField, vps));
						idSet = true;
					}
				}

				if (!idSet) {
					// constant id - single group
					group.setIdExpression(ConstantExpression.create(groupField));
					idSet = true;
				}

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
					group[gi].process(self.expressions[gi].evaluate(self._variables /*, doingMerge*/));
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
	this.idExpression.addDependencies(deps);
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
proto.makeDocument = function makeDocument(id, accums /*,mergeableOutput*/) {
	var out = {};

	/* add the _id field */
	out._id = id;

	/* add the rest of the fields */
	this.fieldNames.forEach(function(fieldName, i) {
		var val = accums[i].getValue(/*mergeableOutput*/);
		if(!val) {
			out[fieldName] = null;
		} else {
			out[fieldName] = val;
		}
	});

	return out;
};

/**
 * Sets the id expression for the group
 *
 * @method setIdExpression
 * @param epxression {Expression} The expression to set
 **/
proto.setIdExpression = function setIdExpression(expression) {
	this.idExpression = expression;
};
