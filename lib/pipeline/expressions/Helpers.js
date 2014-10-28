module.exports = {
	//Returns an object containing unique values. All keys are the same as the corresponding value.
	arrayToSet : function arrayToSet(array){

		var set = {};

		// This ensures no duplicates.
		array.forEach(function (element) {
			var elementString = JSON.stringify(element);
			set[elementString] = element;
		});

		return set;
	}
}