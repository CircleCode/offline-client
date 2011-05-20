Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/preferences.jsm");
Components.utils.import("resource://modules/offlineLightDocument.jsm");

var EXPORTED_SYMBOLS = [ "docManager" ];

function docManagerSingleton() {

}
docManagerSingleton.prototype = {

	_docInstances : {},
	_activeDomain : '',
	dropDomain : function(config) {
		if (config && config.domain) {
			if (this._docInstances[config.domain]) {
				this._docInstances[config.domain] = {};
			}
		}
		return this;
	},
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
					
					this._docInstances[config.domain][config.initid] = new offlineLightDocument(
							config);

					this._docInstances[config.domain][config.initid].domainId=config.domain;
				}
			}
		}
		return this._docInstances[config.domain][config.initid];
	},

	dropDocInstance : function(config) {
		if (config && config.initid) {
			if (!config.domain) {
				config.domain = this.getActiveDomain();
			}
			if (this._docInstances[config.domain][config.initid]) {
				this._docInstances[config.domain][config.initid] = null;
			}
		}
	}
};

var docManager = new docManagerSingleton();

let
defaultDomain = Preferences.get('dcpoffline.domain');
log('default domain is [' + defaultDomain + ']');
if (defaultDomain) {
	docManager.setActiveDomain({
		domain : defaultDomain
	});
}

log('DocManager loaded');