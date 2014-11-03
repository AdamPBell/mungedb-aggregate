var Helpers = module.exports = { //jshint ignore:line

	arrayToSet: function arrayToSet(val) { //NOTE: DEVIATION FROM MONGO: we return an Object of JSON-String to Values
		if (!(val instanceof Array)) throw new Error("Assertion failure");
		var array = val;

		var set = {};
		for (var i = 0, l = array.length; i < l; i++) {
			var item = array[i],
				itemHash = JSON.stringify(array[i]);
			set[itemHash] = item;
		}

		return set;
	},

	setToArray: function setToArray(set) {	//TODO: used??
		var array = [];
		for (var key in set) {
			array.push(set[key]);
		}
		return array;
	},

};
