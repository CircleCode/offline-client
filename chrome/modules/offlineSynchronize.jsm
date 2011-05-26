Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

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
    recordFilesInProgress : false,
    observers : null,
    toString : function() {
        return 'offlineSynchronize';
    }
};

offlineSynchronize.prototype.getCore = function() {
    if (!this.offlineCore) {
        this.offlineCore = new Fdl.OfflineCore({
            context : context
        });

        log('core synv' + typeof this.offlineCore + this.offlineCore.toString());
    }

    return this.offlineCore;

};
offlineSynchronize.prototype.recordOfflineDomains = function(config) {
    var domains = this.getCore().getOfflineDomains();
    // TODO record in database
    var domain = null;
    storageManager.execQuery({
        query : "delete from domains"
    });
    for ( var i = 0; i < domains.length; i++) {
        domain = domains.getDocument(i);
        this.log('record domain :' + domain.getTitle());
        storageManager
                .execQuery({
                    query : "insert into domains(id, name, description, mode,  transactionpolicy, sharepolicy) values(:initid, :name, :description, :mode,  :transactionPolicies, :sharePolicies)",
                    params : {
                        initid : domain.getProperty('initid'),
                        name : domain.getProperty('initid'),
                        description : domain.getTitle(),
                        mode : 'mode',
                        transactionPolicies : domain
                                .getValue('off_transactionpolicy'),
                        sharePolicies : domain.getValue('off_sharepolicy')
                    // not necessary
                    }
                });

    }
    return domains;
};

offlineSynchronize.prototype.synchronizeDomain = function(config) {
    if (config && config.domain) {
        var domain = config.domain;
        // TODO record synchro date in domain table
        this.recordFamilies({
            domain : domain
        });
        this.recordFamiliesBinding({
            domain : domain
        });

        // this.pushDocuments({domain:domain});
        this.pullDocuments({
            domain : domain
        });
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

        var fam = null;
        for ( var i = 0; i < families.length; i++) {
            fam = families.getDocument(i);
            storageManager
                    .execQuery({
                        query : "insert into families(famid, name, title, json_object, creatable) values(:famid, :famname, :famtitle, :fam, :creatable)",
                        params : {
                            famid : fam.getProperty('id'),
                            famtitle : fam.getTitle(),
                            famname : fam.getProperty('name'),
                            fam : JSON.stringify(fam),
                            creatable : fam.control('icreate')
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
                        }
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
            localDocument : localDocument
        });
        if (document) {
            // put document and modifies files
            logConsole('push', document);
            var updateDocument = domain.sync().pushDocument({
                context : domain.context,
                document : document
            });

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
 *            onDetailPercent : function(p) 
 *            onGlobalPercent : function (p)
 *            onDetailLabel : function(t) 
 *            onAddDocumentsToRecord : function(n)
 *            onAddDocumentsRecorded : function(n) 
 *            onAddFilesToRecord :function(n) 
 *            onAddFilesRecorded : function(n) 
 *            onAddDocumentsToSave :function(n)
 *            onAddDocumentsSaved : function(n)
 *            onAddFilesToSave :function(n)
 *            onAddFilesSaved : function(n)
 *            onSuccess : function()
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
    if ((typeof this.observers == 'object') && this.observers[fn]) {
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
            logConsole(config.localDocument.getInitid(), file);
            logConsole("test:" + file.initid + '?='
                    + config.localDocument.getInitid() + ']');
            if (file.initid == config.localDocument.getInitid()) {

                logConsole("test success:" + file.initid + '?='
                        + config.localDocument.getInitid());
                this.filesToUpload.push({
                    path : file.path,
                    attrid : file.attrid,
                    index : file.index,
                    initid : file.initid
                });
                logConsole("uploads", this.filesToUpload);
                this.callObserver('onAddFilesToSave', 1);
                this.log('saving file ' + file.basename);
            }
        }
    } else {
        throw new ArgException(
                "pendingPushFiles need files, localDocument parameter");
    }
};
offlineSynchronize.prototype.pushFiles = function(config) {
    if (config && config.domain && config.onEndPushFiles) {
        logConsole('file to push', this.filesToUpload);
        for ( var i = 0; i < this.filesToUpload.length; i++) {
            var file = this.filesToUpload[i];
            var attrid = file.attrid;
            if (file.index >= 0) {
                attrid += '[' + file.index + ']';
            }
            config.domain.sync().pushFile({
                path : file.path,
                documentId : file.initid,
                attributeId : attrid
            });
            logConsole('pushfile', file);
            // this.filesToUpload.splice(i, 1); // in asynchronous
            this.callObserver('onAddFilesSaved', 1);
        }
        this.filesToUpload = []; // reset array
        config.onEndPushFiles();
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
offlineSynchronize.prototype.recordFiles = function() {
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
                    logConsole('end files', this.filesToDownload);

                    me.callObserver('onSuccess', 1);
                    me.log('all files recorded');
                    me.recordFilesInProgress = false;
                    fileManager.initModificationDates();
                    me.updateWorkTables();
                }
            });
        }
    }
};
offlineSynchronize.prototype.updateWorkTables = function() {

    storageManager
            .execQuery({
                query : "insert into doctitles (famname, initid, title)  select fromname,  initid, title from documents"
            });
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
        var me = this;
        storageManager
                .saveDocumentValues({
                    properties : document.getProperties(),
                    attributes : document.getValues(),
                    callback : {
                        handleCompletion : function() {
                            storageManager
                                    .execQuery({
                                        query : "insert into docsbydomain(initid, domainid, editable) values (:initid, :domainid, :editable)",
                                        params : {
                                            initid : document
                                                    .getProperty('initid'),
                                            domainid : domain
                                                    .getProperty('initid'),
                                            editable : me.isEditable({
                                                domain : domain,
                                                document : document
                                            })
                                        },
                                        callback : {
                                            handleCompletion : function() {
                                                me
                                                        .callObserver(
                                                                'onAddDocumentsRecorded',
                                                                1);
                                                me.log('record document:'
                                                        + document.getTitle());
                                                docManager
                                                        .dropDocInstance({
                                                            domain : domain.id,
                                                            initid : document
                                                                    .getProperty('initid')
                                                        });
                                                me.updateSyncDate({
                                                    document : document
                                                });
                                                me.updateTitles({
                                                    document : document
                                                });
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
        this.pendingFiles({
            domain : domain,
            document : document
        });
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
        // TODO pull all documents and modifies files
        var now = new Date();
        logConsole('pull : ');

        storageManager.lockDatabase({
            lock : true
        });
        logDebug('testpullDocuments');
        this.callObserver('onDetailPercent', 0);
        this.callObserver('onGlobalPercent', 0);
        this.callObserver('onDetailLabel',
                (domain.getTitle() + ':get shared documents'));
        var shared = domain.sync().getSharedDocuments({
        // until : '2011-05-01 13:00'
        });
        this.callObserver('onGlobalPercent', 0);
        var serverDate = shared.date.replace(" ", "T");
        var clientDate = utils.toIso8601(now);

        this.callObserver('onDetailLabel',
                ('recording shared documents : ' + shared.length));
        logConsole('pull shared : ' + shared.length + ':' + serverDate + '--'
                + clientDate);
        var onedoc = null;
        var j = 0;
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
        this.callObserver('onGlobalPercent', 50);
        // var dbcon=storageManager.getDbConnection();
        // dbcon.executeSimpleSQL(docsDomainQuery);
        // logConsole('docsDomain : '+docsDomainQuery);
        this.callObserver('onDetailLabel', domain.getTitle()
                + ':get user documents');
        var userd = domain.sync().getUserDocuments({
        // until : '2011-05-01 13:00'
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
        this.recordFiles();

        storageManager.lockDatabase({
            lock : false
        });
        // logConsole('synchrotimes : ', this.filesToDownload);

        this.callObserver('onGlobalPercent', 100);
    } else {
        throw new ArgException("isEditable need domain parameter");
    }
};

offlineSynchronize.prototype.updateSyncDate = function(config) {
    var now = new Date();
    if (config && config.document) {
        var serverDate = config.document.requestDate.replace(" ", "T");
        var clientDate = utils.toIso8601(now);
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
                var mappingQuery="insert into doctitles (initid, famname, title) values (:initid, :famname, :title)";
                var mappingStmt = dbCon.createStatement(mappingQuery);
                var mappingParams = mappingStmt.newBindingParamsArray();
                var oneTitle=false;
                for ( var i = 0; i < values.length; i++) {
                    if (titles[i] && values[i]) {
                        var bp = mappingParams.newBindingParams();
                        bp.bindByName("famname", famid);
                        bp.bindByName("title", titles[i]);
                        bp.bindByName("initid", values[i]);
                        mappingParams.addParams(bp);
                        oneTitle=true;
                    }
                }
                if (oneTitle) {
                mappingStmt.bindParameters(mappingParams);
                mappingStmt.executeAsync({
                    handleCompletion: function(reason){},
                    handleError: function(reason){
                        logError('updateTitles error:'+reason);
                    }
                });
                }
            }
        }
    } else {
        throw new ArgException("updateTitles need document parameter");
    }
};
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
                document : document
            });
            this.recordFiles();
        } else {
            throw new SyncException("revertDocument failed");
        }
    } else {
        throw new ArgException("revertDocument need domain, initid parameter");
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
        logConsole("active domain" + docManager.getActiveDomain());
        // update file modification date
        var modifiedFiles = fileManager.getModifiedFiles({
            domain : domain.id
        });
        var modifiedDocs = this.getModifiedDocs({
            domain : domain
        });
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
            this.pushFiles({
                domain : domain,
                onEndPushFiles : function() {
                    var thisIsTheEnd = domain.sync().endTransaction();
                    if (thisIsTheEnd) {
                        var results = domain.sync().getTransactionStatus();
                        me.log('end transaction : ' + results.status);
                        logConsole('final Results', results);
                        for ( var docid in results.detailStatus) {
                            if (results.detailStatus[docid].isValid) {
                                // update local document
                                me.revertDocument({
                                    domain : domain,
                                    initid : docid
                                });
                            }
                        }
                        if (results.status == "successTransaction") {
                        this.callObserver('onError', results);
                        }
                    }
                }
            });
        } else {
            throw new SyncException("no transaction set");
        }
        logConsole('mod files', modifiedFiles);
    } else {
        throw new ArgException("pushDocuments need domain parameter");
    }
};

var offlineSync = new offlineSynchronize();