Components.utils.import("resource://modules/logger.jsm");

var EXPORTED_SYMBOLS = ["domUtils"];

domUtils = {
	/**
     * Getting the closest parent with the given tag name.
     */
	getParentByTagName : function(obj, tag) {
	    tag = tag.toLowerCase();
	    while( obj && (obj.tagName.toLowerCase() != tag) ){
	        obj = obj.parentNode;
	    }
	    return obj;
	}
};

log('domUtils loaded');