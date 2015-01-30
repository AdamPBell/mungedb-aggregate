var path = require("path"),
	async = require("async"),
	aggregate = require("../../../");

module.exports = function _runner(opts) {

	var testName = path.basename(opts.module.filename),
		testTime = Date.now();

	// run for different input sizes
	async.map(
		opts.sizes,
		function mapper(size, nextSize) {

			var datas = [];
			for (var i = 0, n = size; i < n; i++) {
				var input = opts.generateInputDoc(i, size);
				if (input instanceof Array) {
					datas.push.apply(datas, input);
				} else {
					datas.push(input);
				}
			}

			// run for a couple of iterations
			var iterations = Array.apply(null, new Array(opts.nIterations)).map(Number);
			async.map(
				iterations,
				function mapper(iteration, nextIteration) {
					var t0 = Date.now();
					aggregate(opts.pipeline, datas, function(err, docs) {
						if (err) return nextIteration(err);
						return nextIteration(null, {
							ms: Date.now() - t0,
							//docs: docs.length,
							//doc0: docs[0],
						});
					});
				},
				function done(err, iterations) {
					if (err) return nextSize(err);
					// get avg
					var sum = 0;
					iterations.forEach(function(iteration) {
						sum += iteration.ms;
					});
					// report results
					console.log("%j", {
						n: testName,
						t: testTime,
						inputs: size,
						avgMs: sum / iterations.length,
						iterations: iterations,
					});
				}
			);

		},
		function done(err, sizes) {
			if (err) throw err;
		}
	);

};
