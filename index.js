/*globals angular:true, benchmarksman:true*/
angular.module("app", [
	"ui.bootstrap",
	"ui.ace"
])

.controller("MainCtrl",
["$scope", "$timeout", "$interpolate",
function($scope, $timeout, $interpolate) {

	$scope.inputs = "";
	$scope.pipeline = "";
	$scope.output = "";
	$scope.isRunning = false;

	$scope.exampleName = "numbers";
	$scope.examples = {

		numbers: {

			inputs: [
				{n:0},
				{n:1},
				{n:2},
				{n:3},
				{n:4},
				{n:5},
				{n:6},
				{n:7},
				{n:8},
				{n:9},
			],

			pipeline: [

				{$match:{
					n: {$gt: 3},
				}},

				{$project:{
					n: true,
					nn: {$multiply: ["$n", "$n"]},
				}},

			],

		},

		strings: {

			inputs: [
				{c:"a"},
				{c:"b"},
				{c:"c"},
				{c:"d"},
				{c:"e"},
				{c:"f"},
				{c:"g"},
				{c:"h"},
				{c:"i"},
				{c:"j"},
			],

			pipeline: [

				{$match:{
					c: {$lt: "e"},
				}},

				{$project:{
					c: true,
					cc: {$concat: ["$c", "$c"]},
				}},

			],

		},

	};


	$scope.setExample = function(exName) {
		$scope.exampleName = exName;
	};


	var getFormattedDocs = function getFormattedDocs(docs) {
		return "[\n" +
			"\t" + docs.map(function(doc) {
				return JSON.stringify(doc, 0, 1)
					.replace(/\n\s*/g, " ");
			})
			.join(",\n\t") +
			"\n]\n";
	};


	$scope.$watch("exampleName", function onExampleNameChanged() {
		if (!($scope.exampleName in $scope.examples))
			throw new Error("invalid exampleName");
		var example = $scope.examples[$scope.exampleName];

		$scope.inputs = "exports.inputs = " + getFormattedDocs(example.inputs).trimRight() + ";\n";

		$scope.pipeline = "exports.pipeline = [\n" +
			"\n\t" +
			example.pipeline.map(function(docSrc) {
				for (var key in docSrc) break; // get first key
				return "{" + key + ": " +
					JSON.stringify(docSrc[key], 0, "\t") +
					"}";
			})
				.join(",\n\n")
				.split("\n")
				.join("\n\t") +
			"\n\n];\n";

		$scope.output = "";
	});


	$scope.run = function run() {

		$scope.output = "";
		$scope.isRunning = true;

		// force UI update if not in progress (i.e., from non-angular event)
		if (!$scope.$$phase)
			$scope.$apply();

		try {

			//jshint evil:true
			var inputs = eval("(exports={})," + $scope.inputs);
			var pipeline = eval("(exports={})," + $scope.pipeline);
			//jshint evil:false

			$timeout(function() { // defer a bit to allow UI to update

				var output = aggregate(pipeline, inputs);

				$scope.output = "exports.outputs = " + getFormattedDocs(output).trimRight() + ";\n";

				$scope.isRunning = false;

			}, 100);

		} catch (err) {

			$scope.isRunning = false;
			$scope.output = String(err);
			$scope.$apply();

		}
	};


	$scope.aceLoaded = function aceLoaded(editor) {

		// disable warning about deprecated autoscroll behavior
		editor.$blockScrolling = Infinity;

		// enable simple completion
		editor.setOptions({
			enableBasicAutocompletion: true,
			enableSnippets: false,
		});

		// Set Command-Enter to run
		editor.commands.addCommand({
			name: "run",
			bindKey: {
				mac: "Command-Enter",
				win: "Ctrl-Enter",
			},
			exec: function execRun(editor) {
				$scope.run();
			},
		});

		// Unset Command-L so that it selects location again
		editor.commands.addCommand({
			name: "location",
			bindKey: {
				mac: "Command-l",
				win: "Ctrl-l",
			},
			exec: null, // do nothing
		});

	};

}]);
