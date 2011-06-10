Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/preferences.jsm");
Components.utils.import("resource://modules/storageManager.jsm");
Components.utils.import("resource://modules/localDocument.jsm");
Components.utils.import("resource://modules/localDocumentList.jsm");

var EXPORTED_SYMBOLS = [ "docManager" ];

function docManagerSingleton() {

}

docManagerSingleton.prototype = {

	_docInstances : {},
	_activeDomain : '',

	/**
	 * @access private
	 * @param config
	 * @returns
	 */
	dropDomain : function(config) {
		if (config && config.domain) {
			if (this._docInstances[config.domain]) {
				this._docInstances[config.domain] = {};
			}
		}
		return this;
	},
	/**
	 * @access private
	 * @param config
	 * @returns
	 */
	initDomain : function(config) {
		if (config && config.domain) {
			if (config.force || (this._docInstances[config.domain] === undefined)) {
			    log("init domain " + config.domain + " at {}");
				this._docInstances[config.domain] = {};
			} else {
			    log("domain " + config.domain + " si already initialised");
			}
		}
		return this;
	},
	getActiveDomain : function() {
		return this._activeDomain;
	},
	setActiveDomain : function(config) {
		if (config) {
			if (config.domain != this.getActiveDomain()) {
	            log("switch ActiveDomain from: " + this.getActiveDomain() + " to " + config.domain);
				if (!this._docInstances.hasOwnProperty(config.domain)) {
					this.initDomain(config);
				}
				this._activeDomain = config.domain;
			}
		}
		return this;
	},
	/**
	 * get document from local database
	 * @access public
	 * @param config
	 *     initid 
	 *     name
	 * @return localDocument
	 */
	getLocalDocument : function(config) {
	    if (config && config.name) {
	        config.initid=this.nameToInitid(config.name);
	        if (! config.initid) return null;
	    }
		if (config && config.initid) {
		    try {
			if (!config.domain) {
				config.domain = this.getActiveDomain();
			}
			if (!this._docInstances[config.domain][config.initid]) {
				this.initDocInstance(config);
			}
			return this._docInstances[config.domain][config.initid];
		    } catch (e) {
		        return null; // no document found
		    }
		} else {
			throw "getLocalDocument :: need initid parameter";
		}
	},
	
	
	/**
     * get document from local database
     * @access public
     * @param config
     *     initid 
     *     name
     * @return localDocument
     */
	getFamilyTitle : function(config) {
	    
	    if (config && config.name) {
	        var r=storageManager
	        .execQuery({
	            query : "select title from families where name=:name",
	            params:{
	                name:config.name
	            }
	        });
	        if (r.length > 0) {
	            return r[0].title;
	        }
	    } else {
	        throw "getFamilyTitle :: need name parameter";
	    }
	    return 'no family title';
	},
	
	nameToInitid : function (name) {
	    var r = storageManager.execQuery({
            query : 'select initid from documents where name=:name',
            params: {
                name:name
            }
        });
	    if (r.length > 0) {
	        return r[0].initid;
	    }
	    return 0;
	},
	
	/**
	 * convert local document to server document
	 * @access public
	 * @param config
	 *    context : {Fdl.context}
	 *    localDocument : {localDocument}
	 * @return Fdl.Document
	 */
	localToServerDocument : function(config) {
		Components.utils.import("resource://modules/fdl-data-debug.jsm");
		if (config && config.localDocument) {
			if (!config.domain) {
				config.domain = this.getActiveDomain();
			}
			logConsole('local', config.localDocument.properties);
			var doc=new Fdl.Document({context:config.context});
			doc.affect({properties:config.localDocument.properties,
				values:config.localDocument.values});
			return doc;
		} else {
			throw "localToServerDocument :: need localDocument parameter";
		}
	},
	/**
	 * @access private
	 * @param config
	 * @returns
	 */
	initDocInstance : function(config) {
		if (config) {
			config.domain = config.domain || this.getActiveDomain();

			if (config.doc) {
				var docid=config.doc.getProperty('initid');
				if (config.force
				|| (!this._docInstances[config.domain][docid])) {
					this._docInstances[config.domain][docid] = config.doc;
					this._docInstances[config.domain][docid].domainId=config.domain;
				}
			} else if (config.initid) {
				if (config.force
				|| (!this._docInstances[config.domain][config.initid])) {

					this._docInstances[config.domain][config.initid] = new localDocument(
					config);

					this._docInstances[config.domain][config.initid].domainId=config.domain;
				}
			}
		}
		return this._docInstances[config.domain][config.initid];
	},
	/**
	 * @access private
	 * @param config
	 * @returns
	 */
	dropDocInstance : function(config) {
		if (config && config.initid) {
			if (!config.domain) {
				config.domain = this.getActiveDomain();
			}
			if (this._docInstances[config.domain][config.initid]) {
				this._docInstances[config.domain][config.initid] = null;
			}
		}
	},
	getModifiedDocuments : function (config) {
		if (config && config.domain) {
			var domainId=config.domain;
			logConsole('domain'+domainId);
			var r = storageManager
			.execQuery({
				query : 'select documents.initid from documents, synchrotimes, docsbydomain ' +
				'where docsbydomain.initid=documents.initid and synchrotimes.initid=documents.initid '+
				'and synchrotimes.lastsynclocal < synchrotimes.lastsavelocal and docsbydomain.domainid=:domain',
				params: {
					domain:domainId
				}
			});

			logConsole('mod doc',r);
			var dl=new localDocumentList({
				content:r
			});
			return dl;
		} else {
			logError('getModifiedDocuments : missing parameters');
			//logConsole('error', config);
		}
		return null;
	}
};

var docManager = new docManagerSingleton();/*

let defaultDomain = Preferences.get('dcpoffline.domain');
log('default domain is [' + defaultDomain + ']');
if (defaultDomain) {
	docManager.setActiveDomain({
		domain : defaultDomain
	});
}*/

