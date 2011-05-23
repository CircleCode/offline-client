var EXPORTED_SYMBOLS = [ "ArgException" , "SyncException"];
function ArgException(message) {
	this.message = message;
}
ArgException.prototype = {
	code : Components.results.NS_ERROR_INVALID_ARG,
	toString : function() {
		return this.message;
	},
	valueOf : function() {
		return this.code;
	}
};

function SyncException(message) {
	this.message = message;
}
SyncException.prototype = {
	code : Components.results.NS_ERROR_INVALID_ARG,
	toString : function() {
		Components.utils.import("resource://modules/fdl-context.jsm");
		if (context) this.message+=':'+context.getLastErrorMessage()
		return this.message;
	},
	valueOf : function() {
		return this.code;
	}
};