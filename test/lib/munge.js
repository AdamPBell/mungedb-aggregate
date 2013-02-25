var assert = require("assert"),
	munge = require("../../");

module.exports = {

	"munge": {

		"should be able to use an empty pipeline (no-op)": function(){
			var i = [1, 2, 3],
				p = [],
				e = [1, 2, 3],
				munger = munge(p),
				a = munger(i);
			assert.equal(JSON.stringify(a), JSON.stringify(e), "Unexpected value!");
			assert.deepEqual(a, e, "Unexpected value (not deepEqual)!");
			assert.equal(JSON.stringify(munger(i)), JSON.stringify(e), "Reuse of munger should yield the same results!");
			assert.equal(JSON.stringify(munge(p, i)), JSON.stringify(e), "Alternate use of munge should yield the same results!");
		},


		"should be able to use a $limit operator": function(){
			var i = [{_id:0}, {_id:1}, {_id:2}, {_id:3}, {_id:4}, {_id:5}],
				p = [{$limit:2}],
				e = [{_id:0}, {_id:1}],
				munger = munge(p),
				a = munger(i);
			assert.equal(JSON.stringify(a), JSON.stringify(e), "Unexpected value!");
			assert.deepEqual(a, e, "Unexpected value (not deepEqual)!");
			assert.equal(JSON.stringify(munger(i)), JSON.stringify(e), "Reuse of munger should yield the same results!");
			assert.equal(JSON.stringify(munge(p, i)), JSON.stringify(e), "Alternate use of munge should yield the same results!");
		},

		"should be able to use a $match operator": function(){
			var i = [{_id:0, e:1}, {_id:1, e:0}, {_id:2, e:1}, {_id:3, e:0}, {_id:4, e:1}, {_id:5, e:0}],
				p = [{$match:{e:1}}],
				e = [{_id:0, e:1}, {_id:2, e:1}, {_id:4, e:1}],
				munger = munge(p),
				a = munger(i);
			assert.equal(JSON.stringify(a), JSON.stringify(e), "Unexpected value!");
			assert.deepEqual(a, e, "Unexpected value (not deepEqual)!");
			assert.equal(JSON.stringify(munger(i)), JSON.stringify(e), "Reuse of munger should yield the same results!");
			assert.equal(JSON.stringify(munge(p, i)), JSON.stringify(e), "Alternate use of munge should yield the same results!");
		},
		
		"should be able to use a $skip operator": function(){
			var i = [{_id:0}, {_id:1}, {_id:2}, {_id:3}, {_id:4}, {_id:5}],
				p = [{$skip:2}, {$skip:1}],	//testing w/ 2 ensures independent state variables
				e = [{_id:3}, {_id:4}, {_id:5}],
				munger = munge(p),
				a = munger(i);
			assert.equal(JSON.stringify(a), JSON.stringify(e), "Unexpected value!");
			assert.deepEqual(a, e, "Unexpected value (not deepEqual)!");
			assert.equal(JSON.stringify(munger(i)), JSON.stringify(e), "Reuse of munger should yield the same results!");
			assert.equal(JSON.stringify(munge(p, i)), JSON.stringify(e), "Alternate use of munge should yield the same results!");
		},
		"should be able to use a $skip and then a $limit operator together in the same pipeline": function(){
			var i = [{_id:0, e:1}, {_id:1, e:0}, {_id:2, e:1}, {_id:3, e:0}, {_id:4, e:1}, {_id:5, e:0}],
				p = [{$skip:2}, {$limit:1}],
				e = [{_id:2, e:1}],
				munger = munge(p),
				a = munger(i);
			assert.equal(JSON.stringify(a), JSON.stringify(e), "Unexpected value!");
			assert.deepEqual(a, e, "Unexpected value (not deepEqual)!");
			assert.equal(JSON.stringify(munger(i)), JSON.stringify(e), "Reuse of munger should yield the same results!");
			assert.equal(JSON.stringify(munge(p, i)), JSON.stringify(e), "Alternate use of munge should yield the same results!");
		},

		"should be able to construct an instance with $unwind operators properly": function(){
			var i = [
					{_id:0, nodes:[
						{one:[11], two:[2,2]},
						{one:[1,1], two:[22]}
					]},
					{_id:1, nodes:[
						{two:[22], three:[333]},
						{one:[1], three:[3,3,3]}
					]}
				],
				p = [{$unwind:"$nodes"}, {$unwind:"$nodes.two"}],
				e = [
					{_id:0,nodes:{one:[11],two:2}},
					{_id:0,nodes:{one:[11],two:2}},
					{_id:0,nodes:{one:[1,1],two:22}},
					{_id:1,nodes:{two:22,three:[333]}}
				],
				munger = munge(p),
				a = munger(i);
			assert.equal(JSON.stringify(a), JSON.stringify(e), "Unexpected value!");
			assert.deepEqual(a, e, "Unexpected value (not deepEqual)!");
			assert.equal(JSON.stringify(munger(i)), JSON.stringify(e), "Reuse of munger should yield the same results!");
			assert.equal(JSON.stringify(munge(p, i)), JSON.stringify(e), "Alternate use of munge should yield the same results!");
		},


		"should be able to use a $project operator": function(){
			var i = [{_id:0, e:1, f:23}, {_id:2, e:2, g:34}, {_id:4, e:3}],
				p = [{$project:{
						e:1, 
						a:{$add:["$e", "$e"]}, 
						b:{$cond:[{$eq:["$e", 2]}, "two", "not two"]}	
					}}],
				e = [{_id:0, e:1, b:"not two", a:2}, {_id:2, e:2, b:"two", a:4}, {_id:4, e:3, b:"not two", a:6}],
				munger = munge(p),
				a = munger(i);
			assert.equal(JSON.stringify(a), JSON.stringify(e), "Unexpected value!");
			assert.deepEqual(a, e, "Unexpected value (not deepEqual)!");
			assert.equal(JSON.stringify(munger(i)), JSON.stringify(e), "Reuse of munger should yield the same results!");
			assert.equal(JSON.stringify(munge(p, i)), JSON.stringify(e), "Alternate use of munge should yield the same results!");
		},

		"should be able to construct an instance with $sort operators properly (ascending)": function(){
			var i = [
						{_id:3.14159}, {_id:-273.15},
						{_id:42}, {_id:11}, {_id:1},
						{_id:null}, {_id:NaN}
					],
				p = [{$sort:{_id:1}}],
				e = [
						{_id:null}, {_id:NaN},
						{_id:-273.15}, {_id:1}, {_id:3.14159}, {_id:11}, {_id:42}
					],
				munger = munge(p),
				a = munger(i);
			assert.equal(JSON.stringify(a), JSON.stringify(e), "Unexpected value!");
			//assert.deepEqual(a, e); //does not work with NaN
			assert.equal(JSON.stringify(munger(i)), JSON.stringify(e), "Reuse of munger should yield the same results!");
			assert.equal(JSON.stringify(munge(p, i)), JSON.stringify(e), "Alternate use of munge should yield the same results!");
		}

	}

};

if(!module.parent) (new (require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run();
