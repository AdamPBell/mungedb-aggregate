var microbench = require("./lib/microbench");

microbench({
	module: module,
	generateInputDoc: function(i) {
		return {
			v: i,
		};
	},
	pipeline: [
		{$project:{
			v: true,
			copy: "$v",
		}},
	],
	sizes: [100, 1000, 10000, 100000, 1000000],
	nIterations: 3,
});
