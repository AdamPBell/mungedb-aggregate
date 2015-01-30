var microbench = require("./lib/microbench.js");

microbench({
	module: module,
	generateInputDoc: function(i, size) {
		return {
			v: (i - i / 2) % (i / 10) * i,
		};
	},
	pipeline: [
		{$sort:{
			v: 1,
		}},
	],
	sizes: [100, 1000, 10000, 100000, 1000000],
	nIterations: 3,
});
