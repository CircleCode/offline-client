Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/preferences.jsm");

var EXPORTED_SYMBOLS = ["docManager"];

var _docInstances = {};

// var _domains = {};

var _activeDomain = '';

var initDomain = function(config) {
    if (config && config.domain) {
        if (config.force || (_docInstances[config.domain] === undefined)) {
            _docInstances[config.domain] = {};
            /*
             * this.retrieveDomain({ force: config.force, domain:
             * config.domain });
             */
        }
    }
    return this;
};

var dropDomain = function(config) {
    if (config && config.domain) {
        if (this._docInstances[config.domain]) {
            this._docInstances[config.domain] = {};
        }
    }
    return this;
};

var retrieveDomain = function (config){};

docManager = {
    getActiveDomain : function() {
        return _activeDomain;
    },
    setActiveDomain : function(config) {
        if (config) {
            if (config.domain != this.getActiveDomain()) {
                if (!_docInstances.hasOwnProperty(config.domain)) {
                    initDomain(config);
                }
                _activeDomain = config.domain;
            }
        }
        return this;
    },
    
    getDocInstance : function(config) {
        if (config && config.docid) {
            if (!config.domain) {
                config.domain = this.getActiveDomain();
            }
            if (!_docInstances[config.domain][config.docid]) {
                this.initDocInstance(config);
            }
            return _docInstances[config.domain][config.docid];
        }
    },
    
    initDocInstance : function(config) {
        if (config) {
            config.domain = config.domain || this.getActiveDomain();
            
            if(config.doc){
                if (config.force || (!_docInstances[config.domain][config.docid])) {
                    _docInstances[config.domain][config.doc.docid] = config.doc;
                }
            } else if(config.docid){
                if (config.force || (!_docInstances[config.domain][config.docid])) {
                    Components.utils.import(
                            "resource://modules/offlineLightDocument.jsm",
                            dcpOffline);
                    _docInstances[config.domain][config.docid] = new offlineLightDocument(
                            config);
                }
            }
        }
        return _docInstances[config.domain][config.docid];
    },
    
    dropDocInstance : function(config) {
        if (config && config.docid) {
            if (!config.domain) {
                config.domain = this.getActiveDomain();
            }
            if (_docInstances[config.domain][config.docid]) {
                _docInstances[config.domain][config.docid] = null;
            }
        }
    }
};

let defaultDomain = Preferences.get('dcpoffline.domain');
log('default domain is [' + defaultDomain + ']');
if (defaultDomain) {
    docManager.setActiveDomain({
        domain : defaultDomain
    });
}

log('DocManager loaded');