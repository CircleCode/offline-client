const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://modules/logger.jsm");

var EXPORTED_SYMBOLS = ["fileManager"];

const PATH_FILES = "Fichiers";

const PERMISSIONS_WRITABLE = "0770";
const PERMISSIONS_NOT_WRITABLE = "0550";

const STATUS_PENDING = 0;
const STATUS_DONE = 1;
const STATUS_UNDEF = -1;

var filesRoot = Services.dirsvc.get("ProfD", Ci.nsILocalFile);
filesRoot.append(PATH_FILES);

var fileDwldProgress = {};

var fileManager = {
    saveFile : function saveFile(config) {
        if (config && config.initid && config.attrid && config.basename) {
            try {

                config.writable = config.writable || false;

                if (!config.hasOwnProperty('index')) {
                    config.index = -1;
                }

                // ensure dest dir exists
                var destDirPath = config.initid + '/' + config.attrid;
                if (config.index >= 0) {
                    destDirPath += '/' + config.index;
                }
                config.destDir = filesRoot.clone().append(destDirPath);
                try {
                    config.destDir.create(destDir.DIRECTORY_TYPE,
                            PERMISSIONS_WRITABLE);
                } catch (e) {
                    //not an error: folder existed before
                }

                if ( (! config.aFile) && config.url) {
                    try {
                        var aFile = retrieveFile(config);
                        if (aFile) {
                            config.aFile = aFile;
                        }
                    } catch (e) {
                        logError('missing parameters');
                        logError(e);
                        throw(e);
                    }
                }

                if (config.aFile) {
                    // verify file is in correct dir
                    if ((!filesRoot.contains(aFile))
                            || (aFile.leafName != config.basename)) {
                        try {
                            config.aFile.moveTo(filesRoot, config.basename);
                        } catch (e) {
                            logError('fileManager::saveFile : could not move the file to '
                                    + filesRoot.path);
                            logError(e);
                        }
                    }
                    config.aFile.permissions = config.writable
                            ? PERMISSIONS_WRITABLE
                            : PERMISSIONS_NOT_WRITABLE;
                }
            } catch (e) {
                logError(e);
                throw (e);
            }

        }
    },
    getFile : function getFile(config) {
        if (config && config.initid && config.attrid){
            if (!config.hasOwnProperty('index')) {
                config.index = -1;
            }
            
            if(getPending(config) == STATUS_PENDING){
                throw(new Error('file is currently in download'));
            }
            
            if(!config.hasOwnProperty('basename')){
                var r = storageManager.execQuery({
                    query:'SELECT basename from ' + TABLES_FILES
                            + ' WHERE initid = :initid AND attrid = :attrid AND index = :index',
                    params: {
                        initid: config.initid,
                        attrid: config.attrid,
                        index: config.index
                    }
                });
                config.basename = r[0].basename;
            }
            
            var destDirPath = config.initid + '/' + config.attrid;
            if (config.index >= 0) {
                destDirPath += '/' + config.index;
            }
            destDirPath += '/' + config.basename;
            var aFile = filesRoot.clone().append(destDirPath);
            if(aFile.exists()){
                return aFile;
            } else {
                throw(new Error('file ['+filesRoot.path+'/'+destDirPath+'] does not exists'));
            }
        }
    },

    openfile : function openFile(config) {
        var f = this.getFile(config);
        try {
            f.launch();
        } catch (ex) {
            // if launch fails, try sending it through the system's external
            // file: URL handler
            openExternal(f);
        }
    }
};

////////////////////////////////////////////////////////////////////////////////
//// Utility Functions

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
        storageManager.execQuery({
            query : 'INSERT INTO '
                + TABLES_FILES
                + '(initid, attrid, index, basename, path, writable)'
                + ' VALUES(:initid, :attrid, :index, :basename, :path, :writable)',
            params : {
                initid : config.initid,
                attrid : config.attrid,
                index : config.index,
                basename : config.basename,
                path : config.aFile.path,
                writable : config.writable
            }
        });
    }
}

function retrieveFile(config) {
    if(config && config.url){
        if(!config.aFile){
            config.aFile = Services.dirsvc.get("TmpD", Ci.nsILocalFile);
            config.aFile.append("suggestedName.tmp");
            config.aFile.createUnique(aFile.NORMAL_FILE_TYPE, 0666);
        }
        //FIXME: download file async
        // use addpending(config) before downloading
        // when download finishes
        // use storeFile(config) to register file in database
        // then remove file from pending downloads with removePending(config)
        return aFile;
    } else {
        throw "missing parameters";
    }
}

function addPending(config){
    if (config && config.initid && config.attrid && config.index){
        fileDwldProgress[initid] = fileDwldProgress[initid] || {};
        fileDwldProgress[initid][attrid] = fileDwldProgress[initid][attrid] || {};
        fileDwldProgress[initid][attrid][index] = STATUS_PENDING;
    }
}

function removePending(config){
    if (config && config.initid && config.attrid && config.index){
        fileDwldProgress[initid] = fileDwldProgress[initid] || {};
        fileDwldProgress[initid][attrid] = fileDwldProgress[initid][attrid] || {};
        fileDwldProgress[initid][attrid][index] = STATUS_DONE;
    }
}

function getPending(config){
    if (config && config.initid && config.attrid && config.index){
        if(fileDwldProgress[initid] && fileDwldProgress[initid][attrid]){
            return fileDwldProgress[initid][attrid][index];
        } else {
            return STATUS_UNDEF;
        }
    }
}