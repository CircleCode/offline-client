Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://modules/authentifier.jsm");

Components.utils.import("resource://modules/preferences.jsm");
Components.utils.import("resource://modules/docManager.jsm");
Components.utils.import("resource://modules/storageManager.jsm");
Components.utils.import("resource://modules/fileManager.jsm");
Components.utils.import("resource://modules/fdl-context.jsm");
Components.utils.import("resource://modules/fdl-data-debug.jsm");
Components.utils.import("resource://modules/offline-debug.jsm");
Components.utils.import("resource://modules/utils.jsm");
Components.utils.import("resource://modules/exceptions.jsm");
Components.utils.import("resource://modules/localDocument.jsm");

// Components.utils.import("chrome://dcpoffline/content/fdl-data-debug.js");

var EXPORTED_SYMBOLS = [ "offlineSync" ];

function offlineSynchronize(config) {

};

offlineSynchronize.prototype = {
    filesToDownload : [],
    filesToUpload : [],
    offlineCore : null,
    synchroResults : null,
    recordFilesInProgress : false,
    observers : null,
    _login:null, // to optimize access
    toString : function() {
        return 'offlineSynchronize';
    }
};

offlineSynchronize.prototype.getLogin = function() {
    if (! this._login) {
        this._login=authentificator.currentLogin;// to optimize access
    }
    return this._login;
}

offlineSynchronize.prototype.getCore = function() {
    if (!this.offlineCore) {
        this.offlineCore = new Fdl.OfflineCore({
            context : context
        });

        log('core synv' + typeof this.offlineCore + this.offlineCore.toString());
    }

    return this.offlineCore;

};
offlineSynchronize.prototype.resetAll = function(config) {

    if (config && config.domain) {
        storageManager.execQuery({query : "delete from docsbydomain"});
        storageManager.execQuery({query : "delete from documents"});
        storageManager.execQuery({query : "delete from synchrotimes"});
        storageManager.execQuery({query : "delete from files"});
        storageManager.execQuery({query : "delete from doctitles"});
        storageManager.execQuery({query : "delete from families"});
        storageManager.execQuery({query : "delete from attrmappings"});

        try {
        var filesRoot = Services.dirsvc.get("ProfD", Components.interfaces.nsILocalFile);
        filesRoot.append('Files');
        filesRoot.remove(true);
        } catch (e) {
            
        }
       
        if ( ! config.domain.sync().resetWaitingDocs()) {
            throw new SyncException("resetWaitingDocs");
        }
    } else {
        throw new ArgException("resetAll need domain parameter");
    }

};
offlineSynchronize.prototype.recordOfflineDomains = function(config) {
    var domains = this.getCore().getOfflineDomains();
    if (domains == null) {
        throw new SyncException("noPrivileges");
    }
    // TODO record in database
    var domain = null;

    var lastsyncremote = '';
    /*storageManager.execQuery({
        query : "delete from domains"
    });*/
    for ( var i = 0; i < domains.length; i++) {
        domain = domains.getDocument(i);
        this.log('record domain :' + domain.getTitle());
        var r=storageManager.execQuery({
            query : "select lastsyncremote from domains where id=:initid",
            params : {
                initid : domain.getProperty('initid')
            }});
        if (r.length == 1) {
            lastsyncremote=r[0].lastsyncremote;
        } else {
            lastsyncremote='';
        }
           
        storageManager.execQuery({
                    query : "insert into domains(id, name, description, mode,  transactionpolicy, sharepolicy, lastsyncremote) values(:initid, :name, :description, :mode,  :transactionPolicies, :sharePolicies, :lastsyncremote)",
                    params : {
                        initid : domain.getProperty('initid'),
                        name : domain.getProperty('name'),
                        description : domain.getTitle(),
                        mode : 'mode',
                        transactionPolicies : domain
                                .getValue('off_transactionpolicy'),
                        sharePolicies : domain.getValue('off_sharepolicy'),
                        lastsyncremote : lastsyncremote
                    }
                });

    }
    // TODO delete domains not listed
    return domains;
};

offlineSynchronize.prototype.synchronizeDomain = function(config) {
    if (config && config.domain) {
        var domain = config.domain;
        this.recordFamilies({
            domain : domain
        });
        var me=this;
        this.recordFamiliesBinding({
            domain : domain
        });

        this.pushDocuments({
            domain : domain,
            onComplete:function () {
                //logConsole("oncomplete", domain);
                me.pullDocuments({
                    domain : domain
                });
            }
        });
       /* this.pullDocuments({
            domain : domain
        });*/
    } else {
        throw new ArgException("synchronizeDomain need domain parameter");
    }
};
offlineSynchronize.prototype.recordFamilies = function(config) {
    logConsole('recordFamilies ');

    if (config && config.domain) {
        var domain = config.domain;
        var families = domain.getAvailableFamilies();
        logConsole('pull families : ');
        this.callObserver('onDetailLabel',"retrieve families definition");
        var fam = null;
        for ( var i = 0; i < families.length; i++) {
            fam = families.getDocument(i);

            logConsole('pull families : ' + fam.getTitle());
            this.log('pull families : ' + fam.getTitle());
            
            var ricon=storageManager.execQuery({
                query : "select icon from families where name=:famname",
                params : {
                    famname : fam.getProperty('name')
                }
            });
            var icon='';
            if (ricon.length > 0) {
                icon=ricon[0].icon;
            }
            
            
            storageManager
                    .execQuery({
                        query : "insert into families(famid, name, title, json_object, creatable, icon) values(:famid, :famname, :famtitle, :fam, :creatable, :icon)",
                        params : {
                            famid : fam.getProperty('id'),
                            famtitle : fam.getTitle(),
                            famname : fam.getProperty('name'),
                            fam : JSON.stringify(fam),
                            creatable : fam.control('icreate'),
                            icon:icon
                        }
                    });
            // view generation
            storageManager.initFamilyView(fam);
            this.filesToDownload.push({
                url : fam.getIcon({
                    width : 48
                }),
                basename : fam.getProperty('name') + '.png',
                index : -1,
                attrid : 'icon',
                initid : fam.getProperty('id'),
                writable : false
            });
            storageManager
                    .execQuery({
                        query : "insert into docsbydomain (initid, domainid, editable) values (:initid, :domainid, 0)",
                        params : {
                            initid : fam.getProperty('id'),
                            domainid : domain.getProperty('initid')
                        },
                        callback : {
                            handleCompletion : function() {
                            },
                            handleError : function(reason) {
                                logError('recordFamilies error:' + reason);
                            }
                        }
                    });
            this.updateEnumItems({
                document : fam
            });
            this.callObserver('onAddFilesToRecord', 1);
            this.log("record family :" + fam.getTitle());
        }
    } else {
        throw new ArgException("recordFamilies need domain parameter");
    }
};

offlineSynchronize.prototype.recordFamiliesBinding = function(config) {

    if (config && config.domain) {
        this.callObserver('onDetailLabel',"retrieve families interfaces");
        var domain = config.domain;
        var bindings = domain.view().getFamiliesBindings();
        for ( var famname in bindings) {
            this.writeFile({
                content : bindings[famname],
                dirname : "Bindings",
                basename : famname + ".xml"
            });
        }
    } else {
        throw new ArgException("recordFamiliesBinding need domain parameter");
    }
};

offlineSynchronize.prototype.writeFile = function(config) {
    if (config && config.basename && config.content) {
        var file = Services.dirsvc.get("ProfD",
                Components.interfaces.nsILocalFile);
        if (config.dirname) {
            file.append(config.dirname);
            if (!file.exists() || !file.isDirectory()) { // if
                // it
                // doesn't
                // exist,
                // create
                file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0750);
            }
        }
        file.append(config.basename);
        // file is nsIFile, data is a string
        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                .createInstance(Components.interfaces.nsIFileOutputStream);

        // use 0x02 | 0x20 to open file for create.
        foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);

        var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
                .createInstance(Components.interfaces.nsIConverterOutputStream);
        converter.init(foStream, "UTF-8", 0, 0);
        converter.writeString(config.content);
        converter.close(); // this closes foStream
    } else {
        throw new ArgException("writeFile need path, content parameter");
    }
};
offlineSynchronize.prototype.getModifiedDocs = function(config) {
    if (config && config.domain) {
        var domain = config.domain;
        return docManager.getModifiedDocuments({
            domain : domain.id
        });
    } else {
        throw new ArgException("recordFamilies need domain parameter");
    }
};

offlineSynchronize.prototype.pushDocument = function(config) {
    if (config && config.domain && config.localDocument) {
        var domain = config.domain;
        var localDocument = config.localDocument;
        var document = docManager.localToServerDocument({
            context : domain.context,
            localDocument : localDocument
        });
        if (document) {
            // put document and modified files
            
            this.callObserver('onDetailLabel',"pushing document :"+document.getTitle());
            var updateDocument = domain.sync().pushDocument({
                context : domain.context,
                document : document
            });
            logConsole('pushing', updateDocument.getTitle());
            if (!updateDocument) {
                throw new SyncException("pushDocument");
            } else {
                this.log('push document ' + updateDocument.getTitle());
                this.callObserver('onAddDocumentsSaved', 1);
            }
        } else {
            throw new SyncException("pushDocument: no document");
        }
    } else {
        throw new ArgException(
                "pushDocument need domain, localDocument parameter");
    }
};

offlineSynchronize.prototype.isEditable = function(config) {
    if (config && config.domain && config.document) {
        var domain = config.domain;
        var document = config.document;
        // log2(document.id+' --'+domain.id +
        // '='+document.getProperty('lockdomainid')+':'+document.getProperty('locked')+'='+document.context.getUser().id);
        if (document.getProperty('lockdomainid') != domain.getProperty('id'))
            return false;
        if (document.getProperty('locked') != document.context.getUser().id)
            return false;

        return true;
    } else {
        throw new ArgException("isEditable need domain, document parameter");
    }
};

/**
 * 
 * @param config
 *            onDetailPercent : function(p) onGlobalPercent : function (p)
 *            onDetailLabel : function(t) onAddDocumentsToRecord : function(n)
 *            onAddDocumentsRecorded : function(n) onAddFilesToRecord
 *            :function(n) onAddFilesRecorded : function(n) onAddDocumentsToSave
 *            :function(n) onAddDocumentsSaved : function(n) onAddFilesToSave
 *            :function(n) onAddFilesSaved : function(n) onSuccess : function()
 *            onError : function(status)
 */
offlineSynchronize.prototype.setObservers = function(config) {
    if (config) {
        this.observers = {};
        for ( var i in config)
            this.observers[i] = config[i];
    }
};

offlineSynchronize.prototype.callObserver = function(fn, arg) {
    if ((this.observers != null) && (typeof this.observers == 'object') && this.observers[fn]) {
        try {
            this.observers[fn](arg);
        } catch (e) {
        }
    }
};

offlineSynchronize.prototype.pendingPushFiles = function(config) {
    if (config && config.files && config.localDocument) {
        for ( var i = 0; i < config.files.length; i++) {
            var file = config.files[i];
           // logConsole(config.localDocument.getInitid(), file);
          //  logConsole("test:" + file.initid + '?='+ config.localDocument.getInitid() + ']');
            if (file.initid == config.localDocument.getInitid()) {

               // logConsole("test success:" + file.initid + '?=' + config.localDocument.getInitid());
                this.filesToUpload.push({
                    path : file.path,
                    attrid : file.attrid,
                    index : file.index,
                    initid : file.initid
                });
                //logConsole("uploads", this.filesToUpload);
                this.callObserver('onAddFilesToSave', 1);
                this.log('saving file ' + file.basename);
            }
        }
    } else {
        throw new ArgException(
                "pendingPushFiles need files, localDocument parameter");
    }
};
/**
 * 
 * @param config
 * @returns boolean true if push is ok
 */
offlineSynchronize.prototype.pushFiles = function(config) {
    if (config && config.domain && config.onEndPushFiles) {
        //logConsole('file to push', this.filesToUpload);
        for ( var i = 0; i < this.filesToUpload.length; i++) {
            var file = this.filesToUpload[i];
            var attrid = file.attrid;
            
            var localDocument=docManager.getLocalDocument({initid:file.initid});
            if (localDocument) {
                var lvalues=localDocument.getValue(attrid);
                var index=-2;
                if (Array.isArray(lvalues)) {
                    //logConsole('pusharrayfile :'+file.index, lvalues);
                    for (var vi=0;vi < lvalues.length; vi++) {
                        if (lvalues[vi]==file.index) index=vi;
                    }
                }  else {
                    if (lvalues == file.index) {
                        index=-1;
                    }
                }
                if (index != -2) {
                    if (index >= 0) {
                        attrid += '[' + index + ']';
                    }
                    config.domain.sync().pushFile({
                        path : file.path,
                        documentId : file.initid,
                        attributeId : attrid
                    });
                    logConsole('pushfile :'+attrid, file);
                } else {
                    // file parasite to delete
                    //logConsole('need delete', {initid:file.initid, attrid:attrid, localIndex:file.index});
                    //fileManager.deleteFile({initid:file.initid, attrid:attrid, localIndex:file.index});
                    
                }
            }
            // this.filesToUpload.splice(i, 1); // in asynchronous
            this.callObserver('onAddFilesSaved', 1);
        }
        this.filesToUpload = []; // reset array
        return config.onEndPushFiles();
    } else {
        throw new ArgException("pushFiles need domain onEndPushFiles parameter");
    }
};
offlineSynchronize.prototype.pendingFiles = function(config) {
    if (config && config.domain && config.document) {
        var domain = config.domain;
        var document = config.document;

        var oas = document.getAttributes();
        var oa = null;
        var url = '';
        var basename = '';
        for ( var aid in oas) {
            oa = oas[aid];

            if ((oa.type == 'file') || (oa.type == 'image')) {
                if (document.getValue(aid)) {
                    var writable = this.isEditable({
                        domain : domain,
                        document : document
                    }) && (oa.getVisibility() == 'W');

                    if (oa.inArray()) {
                        var vs = document.getValue(aid);
                        for ( var fi = 0; fi < vs.length; fi++) {
                            if (vs[fi]) {
                                url = oa.getUrl(vs, document.id, {
                                    index : fi
                                });

                                if (url) {
                                    basename = oa.getFileName(vs[fi]);
                                    if (!basename)
                                        basename = "noname";
                                    this.filesToDownload
                                            .push({
                                                url : url,
                                                basename : basename,
                                                index : fi,
                                                serverid : vs[fi],
                                                attrid : aid,
                                                initid : document
                                                        .getProperty('initid'),
                                                writable : writable
                                            });
                                    this.callObserver('onAddFilesToRecord', 1);
                                    this.log('recording file ' + basename);
                                }
                            }
                        }
                    } else {
                        url = oa.getUrl(document.getValue(aid), document.id);
                        if (url) {
                            basename = oa.getFileName(document.getValue(aid));
                            if (!basename)
                                basename = "noname";
                            this.filesToDownload.push({
                                url : oa.getUrl(document.getValue(aid),
                                        document.id),
                                basename : basename,
                                index : -1,
                                serverid : document.getValue(aid),
                                attrid : aid,
                                initid : document.getProperty('initid'),
                                writable : writable
                            });
                            this.callObserver('onAddFilesToRecord', 1);
                        }
                    }
                }
            }
        }
    } else {
        throw new ArgException("pendingFiles need domain, document parameter");
    }
};

offlineSynchronize.prototype.log = function(msg) {
    log({
        message : msg,
        code : 'SYNC'
    });
};
/**
 * 
 */
offlineSynchronize.prototype.recordFiles = function(config) {
    if (!this.recordFilesInProgress) {
        logConsole('recordFilesInProgress');
        if (this.filesToDownload.length > 0) {
            var me = this;
            this.recordFilesInProgress = true;

            fileManager.downloadFiles({
                files : this.filesToDownload,
                acquitFileCallback : function() {
                    me.callObserver('onAddFilesRecorded', 1);
                },
                completeFileCallback : function() {
                    //logConsole('end files', this.filesToDownload);
                    if (me.synchroResults) {
                        if (me.synchroResults.status != "successTransaction") {
                            me.callObserver('onError', me.synchroResults);
                        } else {
                            me.callObserver('onSuccess', me.synchroResults);
                        }
                    } else {
                        me.callObserver('onSuccess', true);
                    }
                    me.log('all files recorded');
                    me.recordFilesInProgress = false;
                    fileManager.initModificationDates();
                    me.updateWorkTables();
                    me.updateDomainSyncDate(config);
                    if (config.onAfterRecord) {
                        logConsole('call end files recod', config);
                        config.onAfterRecord();
                    }
                }
            });
        } else {
            if (this.synchroResults) {
                if (this.synchroResults.status != "successTransaction") {
                    this.callObserver('onError', this.synchroResults);
                } else {
                    this.callObserver('onSuccess', this.synchroResults);
                }
            } else {
                this.callObserver('onSuccess', true);
            }
        }
    }
};

offlineSynchronize.prototype.updateDomainSyncDate = function(config) {

    if (config && config.domain) {
        var domain = config.domain;
        var syncDate=this.pullBeginDate.toISOString();
        storageManager
                .execQuery({
                    query : "update domains set lastsyncremote=:pulldate where id=:domainid",
                        params:{
                            pulldate:syncDate,
                            domainid:domain.id
                        }
                });
    } else {
        throw new ArgException("updateDomainSyncDate need domain parameter");
    }
};


offlineSynchronize.prototype.getDomainSyncDate = function(config) {

    if (config && config.domain) {
        var domain = config.domain;
        var r=storageManager
                .execQuery({
                    query : "select * from domains where id=:domainid",
                        params:{
                            domainid:domain.id
                        }
                });
        if (r.length == 1) {
            return r[0].lastsyncremote;
        } else {
            throw new SyncException("getDomainSyncDate : domain not found");
        }
    } else {
        throw new ArgException("getDomainSyncDate need domain parameter");
    }
};

offlineSynchronize.prototype.updateWorkTables = function() {

    storageManager
            .execQuery({
                query : "insert into doctitles (famname, initid, title)  select fromname,  initid, title from documents"
            });
};

/**
 * @param object config
 *    origin : user or shared
 *    domain.id  : domain id
 */
offlineSynchronize.prototype.getRecordedDocuments = function(config) {
    if (config && config.domain && config.origin && (config.origin == 'user' || config.origin == 'shared')) {
        var query="select documents.initid, documents.revdate, documents.locked, documents.lockdomainid from documents, docsbydomain ";
        query += "where documents.initid = docsbydomain.initid and docsbydomain.domainid=:domainid";
        if (config.origin == 'user' ) {
            query += " and docsbydomain.isusered ";
        } else {
            query += " and docsbydomain.isshared ";
        }
        var r=storageManager.execQuery({
            query : query,
            params: {
                domainid:config.domain.id
            }
        });
        //logConsole("getRecordedDocuments", r);
        return r;
    } else {
        throw new ArgException("getRecordedDocuments need domain, origin parameter");
    }
};

offlineSynchronize.prototype.retrieveReport = function(config) {
    logConsole("retrieveReport");
    if (config && config.domain ) {
        var report = config.domain.sync().getReport();
        var reportFile=this.getReportFile({domainId:config.domain.id});
        this.writeFile({
            content : report,
            dirname : "Logs",
            basename : reportFile.leafName
        });
        
    } else {
        throw new ArgException("retrieveReport need domain parameter");
    }
};
offlineSynchronize.prototype.getReportFile = function(config) {

    if (config && config.domainId ) {
        var reportFile = Services.dirsvc.get("ProfD",
                Components.interfaces.nsILocalFile);
        reportFile.append("Logs");
        if (!reportFile.exists() || !reportFile.isDirectory()) { 
            // it doesn't exist, create
            reportFile.create(
                    Components.interfaces.nsIFile.DIRECTORY_TYPE, 0750);
        }
       
        var r=storageManager.execQuery({
            query : "select name from domains where id=:domainid",
                params:{
                    domainid:config.domainId
                }
        });
        var fileId=config.domainId;
        if (r.length > 0) {
            if (r[0].name != '') {
              fileId=r[0].name;
            }
        }
        reportFile.append("report-" + fileId + ".html");
        return reportFile;
    } else {
        throw new ArgException("getReportFile need domainId parameter");
    }
};
/**
 * 
 * @param domain
 * @param document
 */
offlineSynchronize.prototype.recordDocument = function(config) {

    if (config && config.domain && config.document) {
        var domain = config.domain;
        var document = config.document;
        this.callObserver('onAddDocumentsToRecord', 1);
        this.callObserver('onDetailLabel',"pulling document :"+document.getTitle());
        logConsole('pull', config.document.getTitle());
        var me = this;
        storageManager
                .saveDocumentValues({
                    properties : document.getProperties(),
                    attributes : document.getValues(),
                    callback : {
                        handleCompletion : function() {
                            var domainRef=domain.getValue("off_ref");
                            var domainFolders=document.getProperty("domainid");
                            var isShared=false;
                            var isUsered=false;
                            if (domainFolders.indexOf('offshared_'+domainRef) >=0) {
                                isShared=true;
                            }
                            if (domainFolders.indexOf('offuser_'+domainRef+'_'+me.getLogin()) >=0) {
                                isUsered=true;
                            }
                            storageManager
                                    .execQuery({
                                        query : "insert into docsbydomain(initid, domainid, editable, isshared, isusered) values (:initid, :domainid, :editable, :isshared, :isusered)",
                                        params : {
                                            initid : document
                                                    .getProperty('initid'),
                                            domainid : domain
                                                    .getProperty('initid'),
                                            editable : me.isEditable({
                                                domain : domain,
                                                document : document
                                            }),
                                            isshared:isShared,
                                            isusered:isUsered
                                        },
                                        callback : {
                                            handleCompletion : function() {
                                                me.callObserver(
                                                                'onAddDocumentsRecorded',
                                                                1);
                                                me.log('record document:'
                                                        + document.getTitle());
                                                docManager
                                                        .dropDocInstance({
                                                            domain : domain.getProperty('initid'),
                                                            initid : document
                                                                    .getProperty('initid')
                                                        });
                                                me.updateSyncDate({
                                                    document : document
                                                });
                                                me.updateTitles({
                                                    document : document
                                                });
                                                if (config.recordFiles) {
                                                    me.pendingFiles({
                                                        domain : config.domain,
                                                        document : config.document
                                                    });
                                                }
                                                if (config.recordFiles && (me.filesToDownload.length > 0)) {
                                                    me.recordFiles({domain:config.domain, 
                                                        onAfterRecord:config.onAfterRecord});
                                                } else {
                                                    if (config.onAfterRecord) {
                                                        config.onAfterRecord(me);
                                                    }
                                                }
                                            }
                                        }
                                    });
                        }
                    }
                });

        // storage in domain doc table also
        /*
         * storageManager .execQuery({ query : "insert into docsbydomain(initid,
         * domainid, editable) values (:initid, :domainid, :editable)", params : {
         * initid : document.getProperty('initid'), domainid :
         * domain.getProperty('initid'), editable : this.isEditable(domain,
         * document) }, callback : { handleCompletion : function(result) {
         * logConsole("return from a callback");
         * 
         * me.addDocumentsRecorded(1); } } });
         */
        // this.addDocumentsRecorded(1);
        if (! config.recordFiles) {
            this.pendingFiles({
                domain : domain,
                document : document
            });
        }
    } else {
        throw new ArgException("recordDocument need domain, document parameter");
    }
};




/**
 * 
 * @param domain
 */
offlineSynchronize.prototype.pullDocuments = function(config) {
    if (config && config.domain) {

        var domain = config.domain;
        var j=0;
        // TODO pull all documents and modifies files
        logConsole('pull : ');
        this.pullBeginDate=new Date();
        storageManager.lockDatabase({
            lock : true
        });
        logDebug('testpullDocuments');
        this.callObserver('onDetailPercent', 0);
        this.callObserver('onGlobalPercent', 0);
        this.callObserver('onDetailLabel',
                (domain.getTitle() + ':get shared documents'));
        
        var shared = domain.sync().getSharedDocuments({
         //until : this.getDomainSyncDate({domain:config.domain})
            stillRecorded:this.getRecordedDocuments({domain:domain,origin:'shared'})
        });
        this.callObserver('onGlobalPercent', 0);
        if (shared) {
            this.callObserver('onDetailLabel',
                    ('recording shared documents : ' + shared.length));
            var onedoc = null;
            for (j = 0; j < shared.length; j++) {
                onedoc = shared.getDocument(j);
                this.recordDocument({
                    domain : domain,
                    document : onedoc
                });
                logConsole('store : ' + onedoc.getTitle());
                this.log('pull from share :' + onedoc.getTitle());
                this.callObserver('onDetailPercent',
                        ((j + 1) / shared.length * 100));
            }

            this.callObserver('onDetailPercent', 100);
        }
        
        //delete detached document
        this.deleteDocuments({origin:'shared', domain:domain, deleteList:domain.sync().getSharedDocumentsToDelete()});
        
        this.callObserver('onGlobalPercent', 50);
        // var dbcon=storageManager.getDbConnection();
        // dbcon.executeSimpleSQL(docsDomainQuery);
        // logConsole('docsDomain : '+docsDomainQuery);
        this.callObserver('onDetailLabel', domain.getTitle()
                + ':get user documents');
        var userd = domain.sync().getUserDocuments({
            //until : this.getDomainSyncDate({domain:config.domain})
            stillRecorded:this.getRecordedDocuments({domain:domain,origin:'user'})
        });

        this.callObserver('onGlobalPercent', 60);
        this.callObserver('onDetailLabel', 'recording user documents : '
                + userd.length);
        logConsole('pull users : ' + userd.length);
        for (j = 0; j < userd.length; j++) {
            onedoc = userd.getDocument(j);
            this.recordDocument({
                domain : domain,
                document : onedoc
            });
            this.log('pull from user :' + onedoc.getTitle());
            this.callObserver('onDetailPercent', (j + 1) / userd.length * 100);
        }
        this.callObserver('onGlobalPercent', 90);
        
        /*
         * storageManager .execQuery({ query : "insert into synchrotimes
         * (initid, lastsyncremote, lastsynclocal, lastsavelocal) select initid ,
         * :serverDate, :clientDate , :clientDate from documents", params : {
         * clientDate : clientDate, serverDate : serverDate } });
         */
        this.recordFiles({domain:domain});
        this.retrieveReport({domain:domain});
        this.deleteDocuments({origin:'user', domain:domain, deleteList:domain.sync().getUserDocumentsToDelete()});
        storageManager.lockDatabase({
            lock : false
        });
        // logConsole('synchrotimes : ', this.filesToDownload);

        this.callObserver('onGlobalPercent', 100);
    } else {
        throw new ArgException("pullDocuments need domain parameter");
    }
};
offlineSynchronize.prototype.deleteDocuments = function(config) {

    if (config && config.domain && config.origin && config.deleteList && (config.origin == 'user' || config.origin == 'shared')) {

        if (config.deleteList.length > 0) {
            var sinitids="'"+config.deleteList.join("','")+"'";
            this.log("delete documents :"+sinitids);
            var callback={
                    handleCompletion : function() {
                        // clean database
                        storageManager.execQuery({
                            query :"delete from docsbydomain where not docsbydomain.isshared and not docsbydomain.isusered"});
                        storageManager.execQuery({
                            query :"delete from documents where initid not in (select initid from docsbydomain)"});
                        if (config.onAfterUnlink) {
                            config.onAfterUnlink(config.deleteList);
                        }
                    }
            };

            if (config.origin == "shared") {
                storageManager.execQuery({
                    query : "update docsbydomain set isshared=0 where isshared and domainid=:domainid and initid in ("+sinitids+")",
                    params : {
                        domainid:config.domain.id
                    },
                    callback:callback});
            } else if (config.origin == "user"){
                storageManager.execQuery({
                    query : "update docsbydomain set isusered=0 where isusered and domainid=:domainid and initid in ("+sinitids+")",
                    params : {
                        domainid:config.domain.id
                    },
                    callback:callback});
            }


            logConsole("deleteDocuments", config.deleteList );
        }

    } else {
        throw new ArgException("deleteDocuments need domain, deleteList, origin parameter");
    }
};
offlineSynchronize.prototype.updateSyncDate = function(config) {
    var now = new Date();
    if (config && config.document) {
        var serverDate = config.document.requestDate.replace(" ", "T");
        var clientDate = now.toISOString();
        storageManager
                .execQuery({
                    // query : "update synchrotimes set
                    // lastsyncremote=:serverDate, lastsynclocal=:clientDate,
                    // lastsavelocal=:clientDate where initid=:initid",
                    query : "insert into synchrotimes (lastsyncremote, lastsynclocal,lastsavelocal,initid) values (:serverDate, :clientDate, :clientDate, :initid)",

                    params : {
                        clientDate : clientDate,
                        serverDate : serverDate,
                        initid : config.document.getProperty('initid')
                    }
                });
    } else {
        throw new ArgException("updateSyncDate need document parameter");
    }
};

offlineSynchronize.prototype.updateTitles = function(config) {

    if (config && config.document) {
        var oas = config.document.getAttributes();
        for ( var aid in oas) {
            if (oas[aid].type == 'docid') {
                var values = config.document.getValue(aid);
                var titles = config.document.getDisplayValue(aid);
                if (!Array.isArray(values)) {
                    values = [ values ];
                    titles = [ titles ];
                }
                var famid = oas[aid].relationFamilyId;
                var dbCon = storageManager.getDbConnection();
                var mappingQuery = "insert into doctitles (initid, famname, title) values (:initid, :famname, :title)";
                var mappingStmt = dbCon.createStatement(mappingQuery);
                var mappingParams = mappingStmt.newBindingParamsArray();
                var oneTitle = false;
                for ( var i = 0; i < values.length; i++) {
                    if (titles[i] && (parseInt(values[i])>0) && titles[i]!=' ' && (titles[i]!=values[i])) {
                        var bp = mappingParams.newBindingParams();
                        bp.bindByName("famname", famid);
                        bp.bindByName("title", titles[i]);
                        bp.bindByName("initid", values[i]);
                        mappingParams.addParams(bp);
                        oneTitle = true;
                    }
                }
                if (oneTitle) {
                    mappingStmt.bindParameters(mappingParams);
                    mappingStmt.executeAsync({
                        handleCompletion : function(reason) {
                        },
                        handleError : function(reason) {
                            logError('updateTitles error:' + reason);
                        }
                    });
                }
            }
        }
    } else {
        throw new ArgException("updateTitles need document parameter");
    }
};

offlineSynchronize.prototype.updateEnumItems = function(config) {

    if (config && config.document) {
        var oas = config.document.getAttributes();
        for ( var aid in oas) {
            if (oas[aid].type == 'enum') {

                var dbCon = storageManager.getDbConnection();
                var mappingQuery = "insert into enums (famid, attrid, key, label) values (:famid, :attrid, :key, :label)";
                var mappingStmt = dbCon.createStatement(mappingQuery);
                var mappingParams = mappingStmt.newBindingParamsArray();

                var enums = oas[aid].getEnumItems();
                var oneTitle = false;
                for ( var i = 0; i < enums.length; i++) {
                    var key = enums[i].key;
                    var label = enums[i].label;
                  //  logConsole('enum:' + config.document.id + '-' + key + ':'
                    //        + label);
                    if (key && label) {
                        var bp = mappingParams.newBindingParams();
                        bp.bindByName("famid", config.document.id);
                        bp.bindByName("attrid", aid);
                        bp.bindByName("key", key);
                        bp.bindByName("label", label);
                        mappingParams.addParams(bp);
                        oneTitle = true;
                    }
                }
                if (oneTitle) {
                    mappingStmt.bindParameters(mappingParams);
                    mappingStmt.executeAsync({
                        handleCompletion : function(reason) {
                        },
                        handleError : function(reason) {
                            logError('updateTitles error:' + reason);
                        }
                    });
                }
            }
        }
    } else {
        throw new ArgException("updateTitles need document parameter");
    }
};

/**
 * revert a document from server. The local document is replaced by server document
 *
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>domain : </b>{Fdl.OfflineDomain} the domain</li>
 *            <li><b>initid : </b>{Numeric} the document identificator</li>
 *            <li><b>onAfterRevert : </b>{Function} a callback called after the revert</li>
 *            </ul>
 * @throws SyncException is synchronize error
 * @throws ArgException if missing argument
 * @return void
 */
offlineSynchronize.prototype.revertDocument = function(config) {

    if (config && config.domain && config.initid) {

        var domain = config.domain;
        var document = domain.sync().revertDocument({
            document : {
                id : config.initid
            }
        });
        if (document) {
            this.recordDocument({
                domain : domain,
                document : document,
                recordFiles:true,
                onAfterRecord:config.onAfterRevert
            });
        
        } else {
            throw new SyncException("revertDocument failed");
        }
    } else {
        throw new ArgException("revertDocument need domain, initid parameter");
    }
};


/**
 * unlink a document into user folder space. The local document is deleted
 *
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>domain : </b>{Fdl.OfflineDomain} the domain</li>
 *            <li><b>initid : </b>{Numeric} the document identificator</li>
 *            <li><b>onAfterUnlink : </b>{Function} a callback called after the deletion</li>
 *            </ul>
 * @throws SyncException is synchronize error
 * @throws ArgException if missing argument
 * @return void
 */
offlineSynchronize.prototype.unlinkDocument = function(config) {

    if (config && config.domain && config.initid) {

        var domain = config.domain;
        var document = domain.sync().unlinkDocument({
            document : {
                id : config.initid
            }
        });
        if (document) {
            this.deleteDocuments({
                domain : domain,
                origin:'user',
                deleteList:[document.getProperty('initid')],
                onAfterUnlink:config.onAfterUnlink
            });
        } else {
            throw new SyncException("removeUserDocument failed");
        }
    } else {
        throw new ArgException("removeUserDocument need domain, initid parameter");
    }
};

/**
 * book a document user folder space. Insert document in user folder if not yet included
 *
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>domain : </b>{Fdl.OfflineDomain} the domain</li>
 *            <li><b>initid : </b>{Numeric} the document identificator</li>
 *            <li><b>onAfterBook : </b>{Function} a callback called after the booking</li>
 *            </ul>
 * @throws SyncException is synchronize error
 * @throws ArgException if missing argument
 * @return void
 */
offlineSynchronize.prototype.bookDocument = function(config) {

    if (config && config.domain && config.initid) {

        var domain = config.domain;
        var document = domain.sync().bookDocument({
            document : {
                id : config.initid
            }
        });
        if (document) {
            this.recordDocument({
                domain : domain,
                document : document,
                recordFiles:true,
                onAfterRecord:config.onAfterBook
            });
        } else {
            throw new SyncException("bookDocument failed");
        }
    } else {
        throw new ArgException("bookDocument need domain, initid parameter");
    }
};
/**
 * unbook a document user folder space. The documentg stay in user folder
 *
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>domain : </b>{Fdl.OfflineDomain} the domain</li>
 *            <li><b>initid : </b>{Numeric} the document identificator</li>
 *            <li><b>onAfterUnbook : </b>{Function} a callback called after the unbooking</li>
 *            </ul>
 * @throws SyncException is synchronize error
 * @throws ArgException if missing argument
 * @return void
 */
offlineSynchronize.prototype.unbookDocument = function(config) {

    if (config && config.domain && config.initid) {

        var domain = config.domain;
        var document = domain.sync().unbookDocument({
            document : {
                id : config.initid
            }
        });
        if (document) {
            this.recordDocument({
                domain : domain,
                document : document,
                recordFiles:true,
                onAfterRecord:config.onAfterUnbook
            });
        } else {
            throw new SyncException("unbookDocument failed");
        }
    } else {
        throw new ArgException("unbookDocument need domain, initid parameter");
    }
};
/**
 * 
 * @param domain
 */
offlineSynchronize.prototype.pushDocuments = function(config) {
    if (config && config.domain) {
        var domain = config.domain;
        this.callObserver('onGlobalPercent', 0);
        docManager.setActiveDomain({
            domain : domain.id
        });
        // update file modification date
        var modifiedFiles = fileManager.getModifiedFiles({
            domain : domain.id
        });
        var modifiedDocs = this.getModifiedDocs({
            domain : domain
        });
        this.synchroResults=null;
        var ldoc;
        // this.callObserver('onAddFilesToSave', modifiedFiles.length);
        this.callObserver('onAddDocumentsToSave', modifiedDocs.length);
        var tid = domain.sync().beginTransaction();
        if (tid) {
            for ( var i = 0; i < modifiedDocs.length; i++) {
                ldoc = modifiedDocs.getLocalDocument(i);
                logConsole("mod doc:" + ldoc.getTitle());
                try {
                    this.pushDocument({
                        domain : domain,
                        localDocument : ldoc
                    });
                    this.pendingPushFiles({
                        files : modifiedFiles,
                        localDocument : ldoc
                    });
                } catch (e) {
                    // need to log here errors TODO
                    // into the log
                }
            }
            var me = this;
            var onComplete=config.onComplete;
            var onError=config.onError;
            this.pushFiles({
                domain : domain,
                onEndPushFiles : function() {
                    var thisIsTheEnd = domain.sync().endTransaction();
                    if (thisIsTheEnd) {
                        me.synchroResults = domain.sync().getTransactionStatus();
                        me.log('end transaction : ' + me.synchroResults.status);
                        logConsole('final Results', me.synchroResults,10);
                        for ( var docid in me.synchroResults.detailStatus) {
                            var detail=me.synchroResults.detailStatus[docid];
                            if (detail.isValid) {
                                if (detail.localId) {
                                    var lddoc=docManager.getLocalDocument({initid:detail.localId});
                                    if (lddoc) {
                                        lddoc.remove();
                                    }
                                }
                                logConsole('refresh;'+docid);
                                // update local document
                                me.revertDocument({
                                    domain : domain,
                                    initid : docid
                                });
                            }
                        }
                        if (me.synchroResults.status != "successTransaction") {
                            me.retrieveReport({domain:domain});
                            me.callObserver('onError', me.synchroResults);
                            return false;
                        } else {
                            //me.callObserver('onSuccess', me.synchroResults);
                           
                            if (onComplete) {
                                onComplete(); // pull documents
                            } else {
                                me.retrieveReport({domain:domain});
                            }
                        }
                        return true;
                    } else {
                        throw new SyncException("end transaction error");
                    }
                }
            });
        } else {
            throw new SyncException("no transaction set");
        }
        //logConsole('mod files', modifiedFiles);
    } else {
        throw new ArgException("pushDocuments need domain parameter");
    }
};

var offlineSync = new offlineSynchronize();