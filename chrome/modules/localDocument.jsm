Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/storageManager.jsm");
Components.utils.import("resource://modules/utils.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

var EXPORTED_SYMBOLS = [ "localDocument" ];

var cc = cc;
var ci = ci;

var _propertyNames = null;
function localDocument(config) {
    if (config) {
        if (config.initid) {
            // existing document
            this.retrieve(config);
        } else if (config.fromid) {
            // new document
            this.create();
        } else {
            // FIXME
            throw "missing arguments";
        }

    }
}
localDocument.prototype = {
        _initid : null,
        properties : {},
        values : {},
        domainId : 0, // set by manager
        retrieve : function(config) {
            try {
                var docRecord = null;
                if (config.docRecord) {
                    docRecord = config.docRecord;
                } else {
                    docRecord = storageManager.getDocument({
                        initid : config.initid
                    });
                }
                var props = this.getPropertiesName(docRecord.fromid);
                this.properties = {};
                this.values = {};
                var val;
                for ( var id in docRecord) {
                    try {
                        val = JSON.parse(docRecord[id]);
                        // val = eval('(' + docRecord[id] + ')');
                    } catch (e) {
                        val = docRecord[id];
                    }
                    if (props[id]) {
                        this.properties[id] = val;
                    } else {
                        this.values[id] = val;
                    }
                }
                // logConsole( "retrieved doc", this);
                this._initid = this.properties.initid;
            } catch (e) {
                log(e, "error when retrieving values");
                throw (e);
            }
        },
        create : function() {
            // FIXME
            this._initid = cc["@mozilla.org/uuid-generator;1"].getService(
                    ci.nsIUUIDGenerator).generateUUID().toString();
        },

        getInitid : function() {
            return this._initid;
        },

        getValue : function(id) {
            if (id) {
                return this.values[id];// not need it is do by storageManager (may
                // be JSON.stringify )
            } else {
                // FIXME
                throw "getValue :: missing arguments";
            }
        },
        getTitle : function() {
            return this.properties.title;
        },
        getProperty : function(id) {
            if (id) {
                return this.properties[id];
            } else {
                // FIXME
                throw "getValue :: missing arguments";
            }
        },

        getPropertiesName : function(fromid) {
            if (!_propertyNames) {
                if (fromid) {
                    _propertyNames = [];
                    var r = storageManager
                    .execQuery({
                        query : 'select attrid from attrmappings where famid=:fromid and isproperty = 1',
                        params : {
                            fromid : fromid
                        }
                    });
                    for ( var i = 0; i < r.length; i++) {
                        _propertyNames[r[i].attrid] = true;
                    }

                } else {
                    throw " getPropertiesName:: missing arguments";
                }
            }
            return _propertyNames;
        },
        setValue : function(id, value) {
            if (id && (value !== undefined)) {
                this.values[id] = value;
            } else {
                // FIXME
                throw "setValue :: missing arguments";
            }
            return this;
        },

        save : function(config) {
            if (this.isEditable() || (config && config.force)) {

                var now = new Date();
                this.properties.revdate = parseInt(now.getTime() / 1000);
                this.properties.mdate = utils.toIso8601(now, true);
                var saveConfig = {
                        attributes : this.values,
                        properties : this.properties
                };
                storageManager.saveDocumentValues(saveConfig);
                storageManager
                .execQuery({
                    query : 'update synchrotimes set lastsavelocal=:mdate where initid=:initid',
                    params : {
                        mdate : utils.toIso8601(now),
                        initid : this._initid
                    }
                });
            } else {
                throw "document " + this._initid + " is not editable";
            }
        },

        isEditable : function() {
            if (!this.domainId) {
                throw "isEditable :: missing arguments";
            }
            logConsole('editable ? ' + this._initid + this.domainId);
            var r = storageManager
            .execQuery({
                query : 'select docsbydomain.editable from files, docsbydomain where docsbydomain.initid = files.initid and docsbydomain.domainid=:domainid and docsbydomain.initid=:initid',
                params : {
                    domainid : this.domainId,
                    initid : this._initid
                }
            });
            logConsole('editable', r);
            if (r.length == 1) {
                return (r[0].editable == 1);
            }
            // TODO
            // search in docsbydomain
            return false;
        },
        getDisplayValue : function(id) {
            // TODO: getDisplayValue
            if (id) {
                return this.getValue(id);
            } else {
                // FIXME
                throw "getDisplayValue :: missing arguments";
            }
        },
        /**
         * @param string
         *            mode view|edit
         * @return string path the absolute path to the file
         */
        getBinding : function (mode) {
            var famName=this.getProperty('fromname');
            var file= Services.dirsvc.get("ProfD", Components.interfaces.nsILocalFile);
            file.append('Bindings');
            file.append(famName+'.xml');

            return file.path+'#document-'+famName+'-'+mode;
        },
        getLabel : function(id) {
            // TODO: getLabel
            // XXX: should be internationalized
            switch (id) {
            case '':
                return 'no id';
            default:
                return 'title of ' + id + ' for document ' + this.getInitid();
            }
        }
};
