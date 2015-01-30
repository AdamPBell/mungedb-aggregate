var microbench = require("./lib/microbench.js");

microbench({
	module: module,
	generateInputDoc: function(i, size) {
		return {
			v: [i, i + 1, i + 2, i + 3, i + 4],
		};
	},
	pipeline: [
		{$unwind: "$v"},
	],
	sizes: [100, 1000, 10000, 100000, 1000000],
	nIterations: 3,
});
