Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/preferences.jsm");
Components.utils.import("resource://modules/storageManager.jsm");
Components.utils.import("resource://modules/localDocument.jsm");
Components.utils.import("resource://modules/localDocumentList.jsm");
Components.utils.import("resource://modules/fdl-data-debug.jsm");
Components.utils.import("resource://modules/utils.jsm");

Components.utils.import("resource://modules/events.jsm");

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
     * 
     * @access public
     * @param config
     *            initid name
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
     * create local document
     * 
     * @access public
     * @param config
     *            fromname family name
     *            fromid family identificator
     * @return localDocument
     */
    createLocalDocument: function(config) {
        if (config && config.fromname) {
            config.fromid=this.familyNameToInitid(config.fromname);
            
        }
        if (config && config.fromid) {
                if (!config.domain) {
                    config.domain = this.getActiveDomain();
                }
                var doc=new localDocument(config);
                doc.domainId=config.domain;

                this._docInstances[config.domain][doc.getInitid()] = doc;

                return this._docInstances[config.domain][doc.getInitid()];
        } else {
            throw "createLocalDocument :: need fromname or fromid parameter";
        }
    },

    /**
     * get document from local database
     * 
     * @access public
     * @param config
     *            initid name
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

    familyNameToInitid : function (name) {
        var r = storageManager.execQuery({
            query : 'select famid from families where name=:name',
            params: {
                name:name
            }
        });
        if (r.length > 0) {
            return r[0].famid;
        }
        return 0;
    },
    /**
     * convert local document to server document
     * 
     * @access public
     * @param config
     *            context : {Fdl.context} localDocument : {localDocument}
     * @return Fdl.Document
     */
    localToServerDocument : function(config) {
        Components.utils.import("resource://modules/fdl-data-debug.jsm");
        if (config && config.localDocument) {
            if (!config.domain) {
                config.domain = this.getActiveDomain();
            }
            // logConsole('local', config.localDocument.properties);
            var doc=new Fdl.Document({context:config.context});
            // clone it
            // var values=Object.create(config.localDocument.values);
            // logConsole("clone", Object.create(config.localDocument.values));
            // logConsole("origi", config.localDocument.values);
            // var values=config.localDocument.values;
            var values=JSON.parse(JSON.stringify(config.localDocument.values));

            doc.affect({properties:config.localDocument.properties,
                values:values});

            var r = storageManager.execQuery({
                query : 'select * from files where initid=:initid',
                params: {
                    initid:config.localDocument.getInitid()
                }
            });
            if (r.length > 0) {
                // convert local file id to server file id
                var family=config.context.getDocument({id:config.localDocument.getProperty('fromid')});
                var oas = family.getAttributes();
                var oa = null;
                for (var aid in oas) {
                    oa = oas[aid];
                    if ((oa.type == 'file') || (oa.type == 'image')) {
                        if (oa.inArray()) {
                            var lfiles=config.localDocument.getValue(oa.id);
                            var sfiles=[];
                            for (var fi=0;fi<lfiles.length;fi++) {
                                sfiles.push(getFileServerId({attrid:oa.id, index:lfiles[fi],localValues:r}));
                            }
                            doc.setValue(oa.id, sfiles);
                        } else {
                            doc.setValue(oa.id, getFileServerId({attrid:oa.id, index:config.localDocument.getValue(oa.id),localValues:r}));
                        }
                    }
                }
            }

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
                if (config.force || (!this._docInstances[config.domain][docid])) {
                    this._docInstances[config.domain][docid] = config.doc;
                    this._docInstances[config.domain][docid].domainId=config.domain;
                }
            } else if (config.fromid && (! config.initid)) {
                var doc = new localDocument(config);
                config.initid = doc.getInitid();
                this._docInstances[config.domain][config.initid] = doc;
                this._docInstances[config.domain][config.initid].domainId=config.domain;
            } else if (config.initid) {
                if (config.force || (!this._docInstances[config.domain][config.initid])) {
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
            // logConsole('error', config);
        }
        return null;
    },

    /*
     * called after a document is closed to remove its references
     */
    onDocumentClosed : function(config){
        // TODO: should be used in conjonction with onDocumentOpen to handle
        // document references
        // it would be better to use document constructors / destructors
        config.initid = config.documentId;
        this.dropDocInstance(config);
    }
};

var docManager = new docManagerSingleton();

function getFileServerId(config) {
    for (var i=0;i< config.localValues.length; i++) {
        if ((config.localValues[i].attrid==config.attrid) && (config.localValues[i].index==config.index)) {
            if ( config.localValues[i].serverid) {
                return config.localValues[i].serverid;
            } else {
                return "newFile";
            }
        }
    }

    return " ";
}



applicationEvent.subscribe("postCloseDocument", docManager.onDocumentClosed, {scope: docManager});

