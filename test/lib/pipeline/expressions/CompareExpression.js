"use strict";
var assert = require("assert"),
	Expression = require("../../../../lib/pipeline/expressions/Expression"),
	CompareExpression = require("../../../../lib/pipeline/expressions/CompareExpression"),
	FieldRangeExpression = require("../../../../lib/pipeline/expressions/FieldRangeExpression"),
	VariablesParseState = require("../../../../Lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../Lib/pipeline/expressions/VariablesIdGenerator"),
	ConstantExpression = require("../../../../Lib/pipeline/expressions/ConstantExpression");

module.exports = {

	"CompareExpression": {

		"constructor()": {

			"should throw Error if no args": function testConstructor() {
				assert.throws(function() {
					new CompareExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $eq, $ne, $gt, $gte, $lt, $lte, $cmp": function testOpName() {
				assert.equal((new CompareExpression(CompareExpression.EQ)).getOpName(), "$eq");
				assert.equal((new CompareExpression(CompareExpression.NE)).getOpName(), "$ne");
				assert.equal((new CompareExpression(CompareExpression.GT)).getOpName(), "$gt");
				assert.equal((new CompareExpression(CompareExpression.GTE)).getOpName(), "$gte");
				assert.equal((new CompareExpression(CompareExpression.LT)).getOpName(), "$lt");
				assert.equal((new CompareExpression(CompareExpression.LTE)).getOpName(), "$lte");
				assert.equal((new CompareExpression(CompareExpression.CMP)).getOpName(), "$cmp");
			}

		},

		"#evaluateInternal()": {

			"$eq": {

				"should return false if first < second; {$eq:[1,2]}": function testEqLt() {
					//debugger;
					var idGenerator = new VariablesIdGenerator();
					var vps = new VariablesParseState(idGenerator);
					var parseOp = Expression.parseOperand({
						$eq: [{
							$const: 1
						}, {
							$const: 2
						}]
					}, vps);
					var result = parseOp.evaluateInternal({});

					//assert.equal(new CompareExpression( CompareExpression.EQ).evaluateInternal({"$eq":[1,2]}), false);
					assert.equal(result, false);

				},

				"should return true if first == second; {$eq:[1,1]}": function testEqEq() {
					var idGenerator = new VariablesIdGenerator();
					var vps = new VariablesParseState(idGenerator);

					assert.equal(Expression.parseOperand({
						$eq: [1, 1]
					}, vps).evaluateInternal({}), true);
				},

				"should return false if first > second {$eq:[1,0]}": function testEqGt() {
					var idGenerator = new VariablesIdGenerator();
					var vps = new VariablesParseState(idGenerator);
					assert.equal(Expression.parseOperand({
						$eq: [1, 0]
					}).evaluateInternal({}), false);
				},

				"should return false if first and second are different types {$eq:[null,0]}": function testEqGt() {
					var idGenerator = new VariablesIdGenerator();
					var vps = new VariablesParseState(idGenerator);
					assert.equal(Expression.parseOperand({
						$eq: [null, 0]
					}, vps).evaluateInternal({}), false);
				},

				"should return false if first and second are different types {$eq:[undefined,0]}": function testEqGt() {
					var idGenerator = new VariablesIdGenerator();
					var vps = new VariablesParseState(idGenerator);
					assert.equal(Expression.parseOperand({
						$eq: [undefined, 0]
					}, vps).evaluateInternal({}), false);
				},

				"should return false if first and second are different arrays {$eq:[[1],[null]]}": function testEqGt() {
					var idGenerator = new VariablesIdGenerator();
					var vps = new VariablesParseState(idGenerator);
					assert.equal(Expression.parseOperand({
						$eq: [
							[1],
							[null]
						]
					}, vps).evaluateInternal({}), false);
				},

				"should return false if first and second are different arrays {$eq:[[1],[]]}": function testEqGt() {
					assert.equal(Expression.parseOperand({
						$eq: [
							[1],
							[]
						]
					}, vps).evaluateInternal({}), false);
					var idGenerator = new VariablesIdGenerator();
					var vps = new VariablesParseState(idGenerator);
				},

				"should return true if first and second are the same arrays {$eq:[[1],[1]]}": function testEqGt() {
					var idGenerator = new VariablesIdGenerator();
					var vps = new VariablesParseState(idGenerator);
					assert.equal(Expression.parseOperand({
						$eq: [
							[1],
							[1]
						]
					}, vps).evaluateInternal({}), true);
				}
			},

			//      "$ne": {

			//              "should return true if first < second; {$ne:[1,2]}": function testNeLt(){
			//	      assert.equal(Expression.parseOperand({$ne:[1,2]}).evaluateInternal({}), true);
			//              },

			//              "should return false if first == second; {$ne:[1,1]}": function testNeLt(){
			//	      assert.equal(Expression.parseOperand({$ne:[1,1]}).evaluateInternal({}), false);
			//              },

			//              "should return true if first > second; {$ne:[1,0]}": function testNeGt(){
			//	      assert.equal(Expression.parseOperand({$ne:[1,0]}).evaluateInternal({}), true);
			//              }

			//      },

			//      "$gt": {

			//              "should return false if first < second; {$gt:[1,2]}": function testGtLt(){
			//	      assert.equal(Expression.parseOperand({$gt:[1,2]}).evaluateInternal({}), false);
			//              },

			//              "should return false if first == second; {$gt:[1,1]}": function testGtLt(){
			//	      assert.equal(Expression.parseOperand({$gt:[1,1]}).evaluateInternal({}), false);
			//              },

			//              "should return true if first > second; {$gt:[1,0]}": function testGtGt(){
			//	      assert.equal(Expression.parseOperand({$gt:[1,0]}).evaluateInternal({}), true);
			//              }

			//      },

			//      "$gte": {

			//              "should return false if first < second; {$gte:[1,2]}": function testGteLt(){
			//	      assert.equal(Expression.parseOperand({$gte:[1,2]}).evaluateInternal({}), false);
			//              },

			//              "should return true if first == second; {$gte:[1,1]}": function testGteLt(){
			//	      assert.equal(Expression.parseOperand({$gte:[1,1]}).evaluateInternal({}), true);
			//              },

			//              "should return true if first > second; {$gte:[1,0]}": function testGteGt(){
			//	      assert.equal(Expression.parseOperand({$gte:[1,0]}).evaluateInternal({}), true);
			//              }

			//      },

			//      "$lt": {

			//              "should return true if first < second; {$lt:[1,2]}": function testLtLt(){
			//	      assert.equal(Expression.parseOperand({$lt:[1,2]}).evaluateInternal({}), true);
			//              },

			//              "should return false if first == second; {$lt:[1,1]}": function testLtLt(){
			//	      assert.equal(Expression.parseOperand({$lt:[1,1]}).evaluateInternal({}), false);
			//              },

			//              "should return false if first > second; {$lt:[1,0]}": function testLtGt(){
			//	      assert.equal(Expression.parseOperand({$lt:[1,0]}).evaluateInternal({}), false);
			//              }

			//      },

			//      "$lte": {

			//              "should return true if first < second; {$lte:[1,2]}": function testLteLt(){
			//	      assert.equal(Expression.parseOperand({$lte:[1,2]}).evaluateInternal({}), true);
			//              },

			//              "should return true if first == second; {$lte:[1,1]}": function testLteLt(){
			//	      assert.equal(Expression.parseOperand({$lte:[1,1]}).evaluateInternal({}), true);
			//              },

			//              "should return false if first > second; {$lte:[1,0]}": function testLteGt(){
			//	      assert.equal(Expression.parseOperand({$lte:[1,0]}).evaluateInternal({}), false);
			//              }

			//      },

			//      "$cmp": {

			//              "should return -1 if first < second; {$cmp:[1,2]}": function testCmpLt(){
			//	      assert.equal(Expression.parseOperand({$cmp:[1,2]}).evaluateInternal({}), -1);
			//              },

			//              "should return 0 if first < second; {$cmp:[1,1]}": function testCmpLt(){
			//	      assert.equal(Expression.parseOperand({$cmp:[1,1]}).evaluateInternal({}), 0);
			//              },

			//              "should return 1 if first < second; {$cmp:[1,0]}": function testCmpLt(){
			//	      assert.equal(Expression.parseOperand({$cmp:[1,0]}).evaluateInternal({}), 1);
			//              },

			//              "should return 1 even if comparison is larger; {$cmp:['z','a']}": function testCmpBracketed(){
			//	      assert.equal(Expression.parseOperand({$cmp:['z','a']}).evaluateInternal({}), 1);
			//              }

			//      },

			//      "should throw Error": {

			//              "if zero operands are provided; {$ne:[]}": function testZeroOperands(){
			//	      assert.throws(function(){
			//	              Expression.parseOperand({$ne:[]}).evaluateInternal({});
			//	      });
			//              },

			//              "if one operand is provided; {$eq:[1]}": function testOneOperand(){
			//	      assert.throws(function(){
			//	              Expression.parseOperand({$eq:[1]}).evaluateInternal({});
			//	      });
			//              },

			//              "if three operands are provided; {$gt:[2,3,4]}": function testThreeOperands(){
			//	      assert.throws(function(){
			//	              Expression.parseOperand({$gt:[2,3,4]}).evaluateInternal({});
			//	      });
			//              }
			//      }

			// },

			// "#optimize()": {

			//      "should optimize constants; {$eq:[1,1]}": function testOptimizeConstants(){
			//              assert.deepEqual(Expression.parseOperand({$eq:[1,1]}).optimize().toJSON(true), {$const:true});
			//      },

			//      "should not optimize if $cmp op; {$cmp:[1,'$a']}": function testNoOptimizeCmp(){
			//              assert.deepEqual(Expression.parseOperand({$cmp:[1,'$a']}).optimize().toJSON(), {$cmp:[1,'$a']});
			//      },

			//      "should not optimize if $ne op; {$ne:[1,'$a']}": function testNoOptimizeNe(){
			//              assert.deepEqual(Expression.parseOperand({$ne:[1,'$a']}).optimize().toJSON(), {$ne:[1,'$a']});
			//      },

			//      "should not optimize if no constants; {$ne:['$a','$b']}": function testNoOptimizeNoConstant(){
			//              assert.deepEqual(Expression.parseOperand({$ne:['$a','$b']}).optimize().toJSON(), {$ne:['$a','$b']});
			//      },

			//      "should not optimize without an immediate field path;": {

			//              "{$eq:[{$and:['$a']},1]}": function testNoOptimizeWithoutFieldPath(){
			//	      assert.deepEqual(Expression.parseOperand({$eq:[{$and:['$a']},1]}).optimize().toJSON(), {$eq:[{$and:['$a']},1]});
			//              },

			//              "(reversed); {$eq:[1,{$and:['$a']}]}": function testNoOptimizeWithoutFieldPathReverse(){
			//	      assert.deepEqual(Expression.parseOperand({$eq:[1,{$and:['$a']}]}).optimize().toJSON(), {$eq:[1,{$and:['$a']}]});
			//              }

			//      },

			//      "should optimize $eq expressions;": {

			//              "{$eq:['$a',1]}": function testOptimizeEq(){
			//	      var expr = Expression.parseOperand({$eq:['$a',1]}).optimize();
			//	      assert(expr instanceof FieldRangeExpression, "not optimized");
			//	      assert.deepEqual(expr.toJSON(), {$eq:['$a',1]});
			//              },

			//              "{$eq:[1,'$a']} (reversed)": function testOptimizeEqReverse(){
			//	      var expr = Expression.parseOperand({$eq:[1,'$a']}).optimize();
			//	      assert(expr instanceof FieldRangeExpression, "not optimized");
			//	      assert.deepEqual(expr.toJSON(), {$eq:['$a',1]});
			//              }

			//      },

			//      "should optimize $lt expressions;": {

			//              "{$lt:['$a',1]}": function testOptimizeLt(){
			//	      var expr = Expression.parseOperand({$lt:['$a',1]}).optimize();
			//	      assert(expr instanceof FieldRangeExpression, "not optimized");
			//	      assert.deepEqual(expr.toJSON(), {$lt:['$a',1]});
			//              },

			//              "{$lt:[1,'$a']} (reversed)": function testOptimizeLtReverse(){
			//	      var expr = Expression.parseOperand({$lt:[1,'$a']}).optimize();
			//	      assert(expr instanceof FieldRangeExpression, "not optimized");
			//	      assert.deepEqual(expr.toJSON(), {$gt:['$a',1]});
			//              }

			//      },

			//      "should optimize $lte expressions;": {

			//              "{$lte:['$b',2]}": function testOptimizeLte(){
			//	      var expr = Expression.parseOperand({$lte:['$b',2]}).optimize();
			//	      assert(expr instanceof FieldRangeExpression, "not optimized");
			//	      assert.deepEqual(expr.toJSON(), {$lte:['$b',2]});
			//              },

			//              "{$lte:[2,'$b']} (reversed)": function testOptimizeLteReverse(){
			//	      var expr = Expression.parseOperand({$lte:[2,'$b']}).optimize();
			//	      assert(expr instanceof FieldRangeExpression, "not optimized");
			//	      assert.deepEqual(expr.toJSON(), {$gte:['$b',2]});
			//              }

			//      },

			//      "should optimize $gt expressions;": {

			//              "{$gt:['$b',2]}": function testOptimizeGt(){
			//	      var expr = Expression.parseOperand({$gt:['$b',2]}).optimize();
			//	      assert(expr instanceof FieldRangeExpression, "not optimized");
			//	      assert.deepEqual(expr.toJSON(), {$gt:['$b',2]});
			//              },

			//              "{$gt:[2,'$b']} (reversed)": function testOptimizeGtReverse(){
			//	      var expr = Expression.parseOperand({$gt:[2,'$b']}).optimize();
			//	      assert(expr instanceof FieldRangeExpression, "not optimized");
			//	      assert.deepEqual(expr.toJSON(), {$lt:['$b',2]});
			//              }

			//      },

			//      "should optimize $gte expressions;": {

			//              "{$gte:['$b',2]}": function testOptimizeGte(){
			//	      var expr = Expression.parseOperand({$gte:['$b',2]}).optimize();
			//	      assert(expr instanceof FieldRangeExpression, "not optimized");
			//	      assert.deepEqual(expr.toJSON(), {$gte:['$b',2]});
			//              },

			//              "{$gte:[2,'$b']} (reversed)": function testOptimizeGteReverse(){
			//	      var expr = Expression.parseOperand({$gte:[2,'$b']}).optimize();
			//	      assert(expr instanceof FieldRangeExpression, "not optimized");
			//	      assert.deepEqual(expr.toJSON(), {$lte:['$b',2]});
			//              }

			//      },


		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
