var ValueSet = module.exports = function ValueSet(vals) {
	this.set = {};
	if (vals instanceof Array)
		this.insertRange(vals);
}, klass = ValueSet, proto = klass.prototype;

proto._getKey = JSON.stringify;

proto.hasKey = function hasKey(key) {
	return key in this.set;
};

proto.has = function has(val) {
	return this._getKey(val) in this.set;
};

proto.insert = function insert(val) {
	var valKey = this._getKey(val);
	if (!this.hasKey(valKey)) {
		this.set[valKey] = val;
		return valKey;
	}
	return undefined;
};

proto.insertRange = function insertRange(vals) {
	var results = [];
	for (var i = 0, l = vals.length; i < l; i++)
		results.push(this.insert(vals[i]));
	return results;
};

proto.equals = function equals(other) {
	for (var key in this.set) {
		if (!other.hasKey(key))
			return false;
	}
	for (var otherKey in other.set) {
		if (!this.hasKey(otherKey))
			return false;
	}
	return true;
};

proto.values = function values() {
	var vals = [];
	for (var key in this.set)
		vals.push(this.set[key]);
	return vals;
};
