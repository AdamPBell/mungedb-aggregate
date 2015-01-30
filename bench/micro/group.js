var microbench = require("./lib/microbench.js");

microbench({
	module: module,
	generateInputDoc: function(i, size) {
		return {
			v: i % (size / 10),
		};
	},
	pipeline: [
		{$group:{
			_id: "$v",
		}},
	],
	sizes: [100, 1000, 10000, 100000, 1000000],
	nIterations: 3,
});
