Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/docManager.jsm");
Components.utils.import("resource://modules/storageManager.jsm");

var EXPORTED_SYMBOLS = ["offlineLightDocument"];

var offlineLightDocument = function(config) {

    var _docid = null;
    var _fromid = null;
    var _values = null;

    var retrieve = function(config) {
        var doc = storageManager.getDocument({
            docid : config.docid
        });
        log(doc);
        _docid = doc.docid;
        _fromid = doc.fromid;
        _values = doc.values;
    };

    var create = function() {
        // FIXME
        _docid = Components.classes["@mozilla.org/uuid-generator;1"]
        .getService(Components.interfaces.nsIUUIDGenerator).generateUUID().toString();
    };

    if (config) {
        if (config.docid) {
            // existing document
            retrieve(config.docid);
        } else if (config.fromid) {
            // new document
            create();
        } else {
            // FIXME
            throw "missing arguments";
        }
        if (config.addToDocManager) {
            // XXX: does it work?
            config.doc = this
            initDocInstance(config);
        }
    } else {
        // FIXME
        throw "missing arguments";
    }

    return {
        get docid () {
            return _docid;
        },
        
        getValue : function(config) {
            if (config && config.attrid) {
                return _values[config.attrid];
            } else {
                throw "missing arguments";
            }
        },
        setValue : function(config) {
            if (config && config.attrid && config.hasOwnAttribute('value')) {
                this._values[config.attrid] = config.value;
            } else {
                throw "missing arguments";
            }
            return this;
        },

        save : function(config) {
            config = config || {};
            config.docid = _docid;
            config.values = _values;
            return storageManager.setDocumentValues(config);
        },

        getDisplayValue : function(config) {
            // TODO: getDisplayValue
            if (config.attrid) {
                return this.getValue(config);
            } else {
                throw "missing arguments";
            }
        },

        getLabel : function(config) {
            // TODO: getLabel
            // XXX: should be internationalized
            switch (config.attrid) {
                default :
                    return 'title of ' + config.attrid + ' for document '
                            + this.docid;
            }
        }
    };
};