Components.utils.import("resource://modules/logger.jsm");

var EXPORTED_SYMBOLS = ["domUtils"];

domUtils = {
        // FIXME: pas de récursivité...
	/**
     * Getting the closest parent with the given tag name.
     */
	getParentByTagName : function(obj, tag) {
	    tag = tag.toLowerCase();
	    while( obj && (obj.tagName.tolowerCase() != tag) ){
	        obj = obj.parentNode
	    }
	    return obj;
	}
};

log('domUtils loaded');