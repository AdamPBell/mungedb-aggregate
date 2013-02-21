var assert = require("assert"),
	FilterBaseDocumentSource = require("../../../../lib/pipeline/documentSources/FilterBaseDocumentSource");

function createAccumulator(){
	var fbds = new FilterBaseDocumentSource();
	fbds.addOperand(new FieldPathExpression("a") );
	return fbds;
}

/**
 * none of the rest of this class can be tested, since all the methods depend on 
 * accept, which is not implemented.
 *
 **/
module.exports = {

	"FilterBaseDocumentSource": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new FilterBaseDocumentSource();
				});
			}

		},

		"#accept()": {

			"should throw Error when calling toMatcherBson": function testConstructor(){
				assert.throws(function(){
					var fbds = new FilterBaseDocumentSource();
					fbds.toMatcherBson();
				});
			}

		},

		"#toMatcherBson()": {

			"should throw Error when calling toMatcherBson": function testConstructor(){
				assert.throws(function(){
					var fbds = new FilterBaseDocumentSource();
					fbds.toMatcherBson();
				});
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

