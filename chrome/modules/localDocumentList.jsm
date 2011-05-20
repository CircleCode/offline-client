/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

Components.utils.import("resource://modules/storageManager.jsm");
//Components.utils.import("resource://modules/docManager.jsm");
var EXPORTED_SYMBOLS = ["localDocumentList"];
/**
 * @class localDocumentList describe the object returned by getContent or Search
 * config.content : array of initid
 */
localDocumentList = function(config) {
	this.content = [];
	if (config && config.content) {
		for ( var i in config)
			this[i] = config[i];
	}
	if (this.content) this.length=this.content.length;
	else {
		throw "localDocumentList :: no content";
	}
};
localDocumentList.prototype = {

	/**
	 * The array of initid 
	 * 
	 * @type Array
	 */
	content : null,


	/**
	 * count of document list
	 * 
	 * @type Numeric
	 */
	length : 0,
	/**
	 * return all document objects return by Fdl.Collection::getContent() or
	 * Fdl.SearchDocument::search()
	 * 
	 * @return {Array} document (FDl.Document) array
	 */
	getLocalDocuments : function() {
		var out = [];
		for ( var i = 0; i < this.content.length; i++) {
			if (typeof this.content[i] == 'object') {
				out.push(this.getLocalDocument(i));
			} else
				alert('FdlDocuments: error in returned');
		}
		return out;
	},
	/**
	 * return document at index position
	 * Fdl.SearchDocument::search()
	 * 
	 * @return {Fdl.Document} document 
	 */
	getLocalDocument : function(index) {
		Components.utils.import("resource://modules/docManager.jsm");
			if (typeof this.content[index] != 'undefined') {
				return (docManager.getLocalDocument( {
					initid : this.content[index].initid
				}));
			}
		
		return null;
	},

	
	toString : function() {
		return 'localDocumentList';
	}

};
