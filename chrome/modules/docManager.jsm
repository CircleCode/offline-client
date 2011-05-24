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
				this._docInstances[config.domain] = {};
				/*
				 * this.retrieveDomain({ force: config.force, domain:
				 * config.domain });
				 */
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
	 * @return localDocument
	 */
	getLocalDocument : function(config) {
		if (config && config.initid) {
			if (!config.domain) {
				config.domain = this.getActiveDomain();
			}
			if (!this._docInstances[config.domain][config.initid]) {
				this.initDocInstance(config);
			}
			return this._docInstances[config.domain][config.initid];
		} else {
			throw "getLocalDocument :: need initid parameter";
		}
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

var docManager = new docManagerSingleton();

let defaultDomain = Preferences.get('dcpoffline.domain');
log('default domain is [' + defaultDomain + ']');
if (defaultDomain) {
	docManager.setActiveDomain({
		domain : defaultDomain
	});
}

