Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/storageManager.jsm");
Components.utils.import("resource://modules/utils.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://modules/exceptions.jsm");

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
        labels : null,
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
                throw new ArgException("getValue :: missing arguments");
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
                throw new ArgException("getValue :: missing arguments");
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
                    throw new ArgException(" getPropertiesName:: missing arguments");
                }
            }
            return _propertyNames;
        },
        setValue : function(id, value) {
            if (id && (value !== undefined)) {
                this.values[id] = value;
            } else {
                // FIXME
                throw new ArgException("setValue :: missing arguments");
            }
            return this;
        },

        save : function(config) {
            if (this.canEdit() || (config && config.force)) {
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
        /**
         * @return boolean true if can
         */
        canEdit : function() {
            if (!this.domainId) {
                throw new ArgException("canEdit :: missing arguments");
            }
            logConsole('editable ? ' + this._initid + this.domainId);
            var r = storageManager
            .execQuery({
                query : 'select docsbydomain.editable from documents, docsbydomain where docsbydomain.initid = documents.initid and docsbydomain.domainid=:domainid and docsbydomain.initid=:initid',
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
        /**
         * @deprecated
         * @param id
         * @returns
         */
        getDisplayValue : function(id) {
            // TODO: getDisplayValue
            if (id) {
                return this.getValue(id);
            } else {
                // FIXME
                throw new ArgException("getDisplayValue :: missing arguments");
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
            
            var ios = Components.classes["@mozilla.org/network/io-service;1"]
                      .getService(Components.interfaces.nsIIOService);
            var fileURI = ios.newFileURI(file);
            
            if(file.exists()){
                return fileURI.spec+'#document-'+famName+'-'+mode;
            } else {
                return null;
            }
        },

        /**
         * get icon path
         * @return string path the absolute path to the file
         */
        getIcon : function () {
            var famName=this.getProperty('fromname');

            var r = storageManager.execQuery({
                query : 'select icon from families where name=:famname',
                params : {
                    famname : famName
                }
            });
            if (r.length==1) {
                return r[0].icon;
            }
            return null;
        },
        getLabel : function(id) {
            if (! id) return "no id";
            if (! this.labels) {
                var r = storageManager.execQuery({
                    query : 'select attrid, label from attrmappings where famid=:fromid',
                    params : {
                        fromid : this.getProperty('fromid')
                    }
                });
                this.labels={};
                for (var i=0;i<r.length;i++) {
                    this.labels[r[i].attrid]=r[i].label;
                }
            }
            if (this.labels[id]) return this.labels[id];
            return "no label "+id;
        },
        /**
         * get row of an array
         * @param string attrid
         */
        getRowNumber: function (attrid) {
            
        }
};
