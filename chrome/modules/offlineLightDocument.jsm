Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/docManager.jsm");
Components.utils.import("resource://modules/storageManager.jsm");

var EXPORTED_SYMBOLS = ["offlineLightDocument"];

var cc = cc;
var ci = ci;

var offlineLightDocument = function(config) {

    var that = this;
    
    var _initid = null;

    function retrieve(config) {
        try{
            var doc = storageManager.getDocument({
                initid : config.initid
            });
            log(doc, "retrieved doc");
            that.properties = doc.properties;
            that.attributes = doc.attributes;
            that._initid = doc.properties.initid;
        } catch(e){
            log(e, "error when retrieving values");
            throw(e);
        }
    };

    function create() {
        // FIXME
        _docid = cc["@mozilla.org/uuid-generator;1"]
                .getService(ci.nsIUUIDGenerator)
                .generateUUID().toString();
    };

    if (config) {
        if (config.initid) {
            // existing document
            retrieve(config.initid);
        } else if (config.fromid) {
            // new document
            create();
        } else {
            // FIXME
            throw "missing arguments";
        }
        if (config.addToDocManager) {
            // XXX: does it work?
            config.doc = this;
            docManager.initDocInstance(config);// FIXME
        }
    } else {
        throw "missing arguments for offlineLightDocument creation";
    }

    return {
        get initid () {return that._initid;},

        get : function(id) {
            if (id) {
                return that[id];
            } else {
                // FIXME
                throw "missing arguments";
            }
        },
        set : function(id, value) {
            if (id && (value !== undefined)) {
                that[id] = value;
            } else {
                // FIXME
                throw "missing arguments";
            }
            return this;
        },

        save : function(config) {
            if (that.editable || config.force) {
                config.values = this;
                return storageManager.saveDocumentValues(config);
            } else {
                throw "document " + that.initid + " is not editable";
            }
        },

        getDisplayValue : function(id) {
            // TODO: getDisplayValue
            if (id) {
                return that.get(id);
            } else {
                // FIXME
                throw "missing arguments";
            }
        },

        getLabel : function(id) {
            // TODO: getLabel
            // XXX: should be internationalized
            switch (id) {
                case '' :
                    return 'no id';
                    break;
                default :
                    return 'title of ' + config.attrid + ' for document '
                            + this.docid;
            }
        }
    };
};