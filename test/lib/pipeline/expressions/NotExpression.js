var assert = require("assert"),
	NotExpression = require("../../../../lib/pipeline/expressions/NotExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");

module.exports = {

	"NotExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new NotExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $dayOfYear": function testOpName(){
				assert.equal(new NotExpression().getOpName(), "$not");
			}

		},

		"#getFactory()": {

			"should return the constructor for this class": function factoryIsConstructor(){
				assert.strictEqual(new NotExpression().getFactory(), undefined);
			}

		},

		"#evaluate()": {

			"should return false for a true input; false for true": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$not:true}).evaluate({}), false);
			},

			"should return true for a false input; true for false": function testStuff(){
				assert.strictEqual(Expression.parseOperand({$not:false}).evaluate({}), true);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);
