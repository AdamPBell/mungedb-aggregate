var TestBase = (function() {
	var klass = function TestBase(overrides) {
			//NOTE: DEVIATION FROM MONGO: using this base class to make things easier to initialize
			for (var key in overrides){
				this[key] = overrides[key];
			}
		},
		proto = klass.prototype;
	proto.createSource = function() {
		//TODO: Fix this once we know proper API
		this._source = CursorDocumentSource.create();
	};
	proto.source = function() {
		return this._source;
	};
	proto.createProject = function(projection) {
		projection = projection || {a:true};
		var spec = {$project:projection};
		this._project = ProjectDocumentSource(spec /*,ctx()*/);
		this.checkJsonRepresentation(spec);
		this._project.setSource(this.source());
	};
	proto.project = function() {
		return this._project;
	};
	proto.assertExhausted = function() {
		var self = this;
		self._project.getNext(function(err, input1) {
			assert.strictEqual(input, DocumentSource.EOF);
			self._project.getNext(function(err, input2) {
				assert.strictEqual(input2, DocumentSource.EOF);
				self._project.getNext(function(err, input3) {
					assert.strictEqual(input3, DocumentSource.EOF);
				});
			});
		});
	};
	proto.checkJsonRepresentation = function() {
		var arr = [];
		this._project.serializeToArray(arr);
		var generatedSpec = arr[0];
		assert.deepEqual(generatedSpec, spec);
	};
	return klass;
})();

module.exports = TestBase;