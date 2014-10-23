var readline = require("readline"),
	aggregate = require("./lib/");

module.exports = function main() {
	var args = process.argv.slice(2);
	if (args.length === 0) console.error("USAGE:\n  aggregate PIPELINE_JSON < INPUT_DOCS.jsonl"), process.exit(1);

	var pipeline = [].concat.apply([], args.map(JSON.parse)),
		inputs = [];

	var	rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		terminal: false
	})
		.on("line", function(line){
			try {
				inputs.push(JSON.parse(line));
			} catch (err) {
				console.error("ERROR: Unable to parse line #" + inputs.length);
				console.error("LINE: " + line);
				throw err;
			}
		})
		.on("close", function () {
			var results = aggregate(pipeline, inputs);
			results.forEach(function(result){
				console.log(JSON.stringify(result));
			});
			process.exit(0);
		});
};
