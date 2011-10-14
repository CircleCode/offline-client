const
Cc = Components.classes;
const
Ci = Components.interfaces;
const
Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/storageManager.jsm");
Cu.import("resource://modules/utils.jsm");
Cu.import("resource://modules/docManager.jsm");

var EXPORTED_SYMBOLS = ["fileManager"];
const
STATE_START = Components.interfaces.nsIWebProgressListener.STATE_START;
const
STATE_STOP = Components.interfaces.nsIWebProgressListener.STATE_STOP;
const
PATH_FILES = "Files";

const
PERMISSIONS_WRITABLE = 0660;
const
PERMISSIONS_NOT_WRITABLE = 0440;

const
TABLE_FILES = 'files';
const
STATUS_DONE = 1;
const
STATUS_UNDEF = -1;

var filesRoot = Services.dirsvc.get("ProfD", Ci.nsILocalFile);
filesRoot.append(PATH_FILES);

var fileDwldProgress = {};

var fileManager = {
    saveFile : function saveFile(config) {

        if (config && config.initid && config.attrid && config.basename
                && config.aFile) {
            try {

                config.writable = config.writable || false;

                if (!config.hasOwnProperty('index')) {
                    config.index = -1;
                }

                var index = config.index;

                var destDir = null;
                try {
                    destDir = this.getFile(config).parent;
                } catch (e) {
                    config.uuid = config.uuid
                            || Components.classes["@mozilla.org/uuid-generator;1"]
                                    .getService(
                                            Components.interfaces.nsIUUIDGenerator)
                                    .generateUUID().toString().slice(1, -1);

                    destDir = filesRoot.clone();
                    destDir.append(config.initid);
                    destDir.append(config.attrid);
                    destDir.append(config.uuid);
                    config.index = config.uuid;
                }

                if (config.aFile) {
                    // verify file is in correct dir
                    if ((!filesRoot.contains(config.aFile, false))
                            || (config.aFile.leafName != config.basename)) {
                        try {
                            if (config.forceCopy) {
                                config.aFile.copyTo(destDir, config.basename);
                                config.aFile = Components.classes["@mozilla.org/file/local;1"]
                                        .createInstance(Components.interfaces.nsILocalFile);
                                config.aFile.initWithPath(destDir.path);
                                config.aFile.append(config.basename);
                                config.newFile = true;
                            } else {
                                config.aFile.moveTo(destDir, config.basename);
                            }
                        } catch (e) {
                            logError('fileManager::saveFile : could not move the file to '
                                    + filesRoot.path);
                            logError(e);
                        }
                    }
                    // logConsole('save in '+destDir.path);
                    config.aFile.permissions = config.writable
                            ? PERMISSIONS_WRITABLE
                            : PERMISSIONS_NOT_WRITABLE;
                    // set ref in database
                    try {
                        storeFile(config);
                        if ((config.uuid) && (config.attrid != 'icon')) {
                            var localDoc = docManager.getLocalDocument({
                                initid : config.initid
                            });
                            if (localDoc) {
                                localDoc.setValue(config.attrid, config.uuid,
                                        index);
                                localDoc.save({
                                    force : true,
                                    noModificationDate : true
                                });
                            }
                        }
                    } catch (e) {
                        throw e;
                    }
                }
            } catch (e) {
                logError(e);
                throw (e);
            }

        } else {
            logError('saveFile : missing parameters');
            // logConsole('error', config);
        }
    },

    deleteFile : function(config) {
        if (config && config.initid && config.attrid
                && (config.index || config.localIndex)) {
            if (!config.hasOwnProperty('index')) {
                config.index = -1;
            }

            var destDir = filesRoot.clone();
            destDir.append(config.initid);
            destDir.append(config.attrid);

            if (!config.localIndex) {
                config.localIndex = docManager.getLocalDocument({
                    initid : config.initid
                }).getValue(config.attrid, config.index);
            }
            if (config.localIndex) {

                destDir.append(config.localIndex);
                try {
                    destDir.remove(true);
                } catch (e) {

                    dropFile(config);
                    // logConsole("file delete:",destDir );
                }
            }

        } else {
            logError('deleteFile : missing parameters');
        }
    },

    /**
     * return files modified
     * @param int config.onlyDocument the idenificator of document to find modified files of this documents
     */
    getModifiedFiles : function(config) {
        if (config && config.domain) {
            var domainId = config.domain;
            this.updateModificationDates();
            logConsole('domain' + domainId);
            var r=null;
            if (config.onlyDocument) {
                r = storageManager
                .execQuery({
                    query : 'select files.* from files, docsbydomain where files.initid=:initid and docsbydomain.initid = files.initid and docsbydomain.domainid=:domainid and docsbydomain.editable=1 and recorddate is not null and recorddate < modifydate',
                    params : {
                        domainid : domainId,
                        initid : config.onlyDocument
                    }
                });
            } else {
                // all documents
                r = storageManager
                .execQuery({
                    query : 'select files.* from files, docsbydomain where docsbydomain.initid = files.initid and docsbydomain.domainid=:domainid and docsbydomain.editable=1 and recorddate is not null and recorddate < modifydate',
                    params : {
                        domainid : domainId
                    }
                });
            }
            return r;
        } else {
            logError('getModifiedFiles : missing domain parameters');
            // logConsole('error', config);
        }
    },

    /**
     * init recorddate when files were downloaded
     */
    initModificationDates : function() {
        var r = storageManager.execQuery({
            query : 'SELECT * from ' + TABLE_FILES
                    + ' WHERE recorddate is null'

        });
        var file = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
        for ( var i = 0; i < r.length; i++) {
            file.initWithPath(r[i].path);
            try {
                storageManager
                        .execQuery({
                            query : 'update '
                                    + TABLE_FILES
                                    + ' set recorddate=:recorddate, modifydate=:recorddate WHERE "initid"=:initid and "index"=:index and attrid=:attrid',
                            params : {
                                recorddate : new Date(file.lastModifiedTime)
                                        .toISOString(),
                                initid : r[i].initid,
                                index : r[i].index,
                                attrid : r[i].attrid
                            }
                        });
            } catch (e) {

            }
        }
    },

    /**
     * update modifydate from files
     */
    updateModificationDates : function(initid) {
        var r = storageManager.execQuery({
            query : 'SELECT *' + ' FROM ' + TABLE_FILES
                    + ' WHERE recorddate is not null'
                    + (initid ? ' AND initid=:initid' : ''),
            params : {
                initid : initid
            }
        });
        var mdate;
        var file = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
        var localDoc = null;

        for ( var i = 0; i < r.length; i++) {
            file.initWithPath(r[i].path);
            try {
                mdate = new Date(file.lastModifiedTime).toISOString();

                if (mdate != r[i].modifydate) {
                    storageManager
                            .execQuery({
                                query : 'update ' + TABLE_FILES
                                        + ' SET modifydate=:modifydate'
                                        + ' WHERE "initid"=:initid'
                                        + ' AND "index"=:index'
                                        + ' AND attrid=:attrid',
                                params : {
                                    modifydate : mdate,
                                    initid : r[i].initid,
                                    index : r[i].index,
                                    attrid : r[i].attrid
                                }
                            });

                    localDoc = docManager.getLocalDocument({
                        initid : r[i].initid
                    });
                    // logConsole('doclocal', localDoc);
                    try {
                        localDoc.touch(new Date(file.lastModifiedTime));
                        // localDoc.save(); // to change modification date
                    } catch (e) {
                        // nothing may be not in good domain
                        // normaly never go here
                        logError(e);
                    }
                }
            } catch (e) {
                // logError(e);
            }
        }
    },
    getFile : function getFile(config) {
        if (config && config.initid && config.attrid) {
            if (!config.hasOwnProperty('index')) {
                config.index = -1;
            } else if (config.index === null) {
                config.index = -1;
            }

            config.index = docManager.getLocalDocument({
                initid : config.initid
            }).getValue(config.attrid, config.index);

            if (!config.index) {
                return null;
                throw (new Error('file attr [' + config.attrid
                        + '] does not exists'));
            }
            var r = storageManager
                    .execQuery({
                        query : 'SELECT path from '
                                + TABLE_FILES
                                + ' WHERE "initid" = :initid AND "attrid" = :attrid AND "index" = :index',
                        params : {
                            initid : config.initid,
                            attrid : config.attrid,
                            index : config.index
                        }
                    });

            if (r.length > 0) {
                config.path = r[0].path;

                var aFile = Services.dirsvc.get("TmpD", Ci.nsILocalFile);
                aFile.initWithPath(config.path);

                if (aFile.exists()) {
                    return aFile;
                } else {
                    throw (new Error('file [' + config.path
                            + '] does not exists'));
                }
            }
        }
        return null;
    },

    openFile : function openFile(config) {
        var f = this.getFile(config);
        try {
            f.launch();
        } catch (ex) {
            // if launch fails, try sending it through the system's external
            // file: URL handler
            openExternal(f);
        }
    },
    /**
     * retrieve file from server
     */
    downloadFiles : function(config) {

        if (config && config.files) {
            this.filesToDownLoad = config.files;
        }
        if (config && config.acquitFileCallback) {
            this.acquitFileCallback = config.acquitFileCallback;
        }
        if (config && config.completeFileCallback) {
            this.completeFileCallback = config.completeFileCallback;
        }
        var file = null;
        for ( var idf = 0; idf < this.filesToDownLoad.length; idf++) {
            if (this.filesToDownLoad[idf] && this.filesToDownLoad[idf].url) {
                file = this.filesToDownLoad[idf];
                break;
            }
        }
        if (!file) {
            this.filesToDownLoad = [];
            if (this.completeFileCallback)
                this.completeFileCallback();
        }

        if (file) {
            // logConsole("downloading the " + file.url + ": " + file.name);
            // create file destination

            file.aFile = createTmpFile();
            // create object URI
            var url_fic = file.url;
            try {
                var obj_URI = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService(Components.interfaces.nsIIOService).newURI(
                                url_fic, null, null);
            } catch (e) {
                alert('theDocument' + file.name + 'doesnot_exist' + " "
                        + url_fic);
            }
            var me = this;
            // create persist object for download
            var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
                    .createInstance(Components.interfaces.nsIWebBrowserPersist);
            persist.progressListener = {
                onProgressChange : function(aWebProgress, aRequest,
                        aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress,
                        aMaxTotalProgress) {
                    // var percentComplete = (aCurTotalProgress /
                    // aMaxTotalProgress) * 100;

                },
                onStateChange : function(aWebProgress, aRequest, aStateFlags,
                        aStatus) {
                    /* var ele = document.getElementById("progress_element"); */
                    if (aStateFlags & STATE_STOP) {
                        // logConsole(file.basename + 'downloaded');

                        if (file.writable) {
                            file.aFile.permissions = 0444;
                        }
                        file.serverFile = true;
                        me.saveFile(file);
                        for ( var i = 0; i < me.filesToDownLoad.length; i++) {
                            if (me.filesToDownLoad[i]
                                    && (me.filesToDownLoad[i].url == file.url)) {
                                // delete me.filesToDownLoad[i];
                                me.filesToDownLoad.splice(i, 1);
                                break;
                            }
                        }
                        me.updateFileSyncDate({
                            initid : file.initid
                        });
                        // TODO Call cleanFileSync
                        me.cleanFileSync({
                            initid : file.initid,
                            attrid : file.attrid
                        });
                        // me.filesToDownLoad.pop();
                        // refreshProgressBar()
                        if (typeof me.acquitFileCallback == "function")
                            me.acquitFileCallback();

                        logConsole("file in queue: "
                                + me.filesToDownLoad.length);
                        me.downloadFiles();
                    }
                }
            };
            const
            nsIWBP = Components.interfaces.nsIWebBrowserPersist;
            const
            flags = nsIWBP.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
            persist.persistFlags = flags;
            persist.saveURI(obj_URI, null, null, null, "", file.aFile);
        }
    },
    updateFileSyncDate : function(config) {
        var now = new Date();
        if (config && config.initid) {
            var clientDate = now.toISOString();
            storageManager
                    .execQuery({
                        query : "update synchrotimes set lastsynclocal=:clientDate where initid=:initid",
                        params : {
                            clientDate : clientDate,
                            initid : config.initid
                        }
                    });
        } else {
            throw new ArgException("updateFileSyncDate need document parameter");
        }
    },
    cleanFileSync : function(config) {
        var localDocument = docManager.getLocalDocument({
            initid : config.initid
        });
        if (localDocument) {

            var r = storageManager.execQuery({
                query : "select * from files where initid=:initid",
                params : {
                    initid : config.initid
                }
            });
            for ( var i = 0; i < r.length; i++) {
                var file = r[i];
                var lvalues = localDocument.getValue(file.attrid);
                var index = -2;
                if (Array.isArray(lvalues)) {
                    // logConsole('pusharrayfile :'+file.index, lvalues);
                    for ( var vi = 0; vi < lvalues.length; vi++) {
                        if (lvalues[vi] == file.index)
                            index = vi;
                    }
                } else {
                    if (lvalues == file.index) {
                        index = -1;
                    }
                }
                if (index == -2) {
                    logConsole('need delete', {
                        initid : file.initid,
                        attrid : file.attrid,
                        localIndex : file.index
                    });
                    fileManager.deleteFile({
                        initid : file.initid,
                        attrid : file.attrid,
                        localIndex : file.index
                    });
                }
            }
        }
    }
};

// //////////////////////////////////////////////////////////////////////////////
// // Utility Functions

function openExternal(aFile) {
    var uri = Cc["@mozilla.org/network/io-service;1"].getService(
            Ci.nsIIOService).newFileURI(aFile);

    var protocolSvc = Cc["@mozilla.org/uriloader/external-protocol-service;1"]
            .getService(Ci.nsIExternalProtocolService);
    protocolSvc.loadUrl(uri);

    return;
}

function storeFile(config) {
    if (config && config.initid && config.attrid && config.basename
            && config.aFile && config.hasOwnProperty('index')
            && config.hasOwnProperty('writable')) {
        if (config.attrid == 'icon') {
            storageManager.execQuery({
                query : 'update families set icon=:path where famid=:initid ',
                params : {
                    initid : config.initid,
                    path : config.aFile.path
                }
            });
        } else {
            try {
                var mdate = new Date(config.aFile.lastModifiedTime)
                        .toISOString();
                var rdate = mdate;
                if (config.newFile && (!config.serverFile)) {
                    rdate = new Date(2000).toISOString();
                }
                storageManager
                        .execQuery({
                            query : 'insert into '
                                    + TABLE_FILES
                                    + '("initid", "attrid", "serverid", "index", "basename", "path", "writable", "recorddate", "modifydate")'
                                    + ' values (:initid, :attrid, :serverid, :index, :basename, :path, :writable, :recorddate, :modifydate)',
                            params : {
                                initid : config.initid,
                                attrid : config.attrid,
                                serverid : (config.serverid)
                                        ? config.serverid
                                        : 'newFile',
                                index : config.index,
                                basename : config.basename,
                                path : config.aFile.path,
                                writable : config.writable,
                                recorddate : rdate,
                                modifydate : mdate
                            }
                        });
            } catch (e) {
                logError('no local file ' + config.attrid);
            }
        }
    } else {
        throw (new ArgException("storeFile : missing arguments"));
    }
};

function dropFile(config) {
    if (config && config.initid && config.attrid
            && config.hasOwnProperty('localIndex')) {
        storageManager
                .execQuery({
                    query : 'DELETE FROM '
                            + TABLE_FILES
                            + ' WHERE initid=:initid AND attrid=:attrid AND "index"=:index',
                    params : {
                        initid : config.initid,
                        attrid : config.attrid,
                        index : config.localIndex
                    }
                });
    }
};
/*
 * function retrieveFile(config) { if (config && config.url) { if
 * (!config.aFile) { config.aFile = createTmpFile(); } // FIXME: download file
 * async // use addpending(config) before downloading // when download finishes //
 * use storeFile(config) to register file in database // then remove file from
 * pending downloads with removePending(config) return aFile; } else { throw
 * "missing parameters"; } }
 */
function createTmpFile() {
    var aFile = Services.dirsvc.get("TmpD", Ci.nsILocalFile);
    aFile.append("suggestedName.tmp");
    aFile.createUnique(aFile.NORMAL_FILE_TYPE, 0666);
    return aFile;
};
/*
 * function addPending(config) { if (config && config.initid && config.attrid &&
 * config.index) { fileDwldProgress[initid] = fileDwldProgress[initid] || {};
 * fileDwldProgress[initid][attrid] = fileDwldProgress[initid][attrid] || {};
 * fileDwldProgress[initid][attrid][index] = STATUS_PENDING; } }
 * 
 * function removePending(config) { if (config && config.initid && config.attrid &&
 * config.index) { fileDwldProgress[initid] = fileDwldProgress[initid] || {};
 * fileDwldProgress[initid][attrid] = fileDwldProgress[initid][attrid] || {};
 * fileDwldProgress[initid][attrid][index] = STATUS_DONE; } }
 * 
 * function getPending(config) { if (config && config.initid && config.attrid &&
 * config.index) { if (fileDwldProgress[initid] &&
 * fileDwldProgress[initid][attrid]) { return
 * fileDwldProgress[initid][attrid][index]; } else { return STATUS_UNDEF; } } }
 */
