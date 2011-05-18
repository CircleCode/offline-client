const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/storageManager.jsm");

var EXPORTED_SYMBOLS = [ "fileManager" ];

const PATH_FILES = "Files";

const PERMISSIONS_WRITABLE = 0660;
const PERMISSIONS_NOT_WRITABLE = 0440;

const TABLE_FILES='files';
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


				var destDir=filesRoot.clone();
				destDir.append(config.initid);
				destDir.append(config.attrid);
				if (config.index>=0) destDir.append(config.index);
				
				if ((!config.aFile) && config.url) {
					try {
						var aFile = retrieveFile(config);
						if (aFile) {
							config.aFile = aFile;
						}
					} catch (e) {
						logError('missing parameters');
						logError(e);
						throw (e);
					}
				}

				if (config.aFile) {
					// verify file is in correct dir
					if ((!filesRoot.contains(config.aFile, false))
							|| (config.aFile.leafName != config.basename)) {
						try {
							config.aFile.moveTo(destDir, config.basename);
						} catch (e) {
							logError('fileManager::saveFile : could not move the file to '
									+ filesRoot.path);
							logError(e);
						}
					}
					logTime('save in '+destDir.path);
					config.aFile.permissions = config.writable ? PERMISSIONS_WRITABLE
							: PERMISSIONS_NOT_WRITABLE;
					storeFile(config);
				}
			} catch (e) {
				logError(e);
				throw (e);
			}

		}
	},
	getFile : function getFile(config) {
		if (config && config.initid && config.attrid) {
			if (!config.hasOwnProperty('index')) {
				config.index = -1;
			}

			if (getPending(config) == STATUS_PENDING) {
				throw (new Error('file is currently in download'));
			}

			if (!config.hasOwnProperty('basename')) {
				var r = storageManager
						.execQuery({
							query : 'SELECT basename from '
									+ TABLE_FILES
									+ ' WHERE initid = :initid AND attrid = :attrid AND index = :index',
							params : {
								initid : config.initid,
								attrid : config.attrid,
								index : config.index
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
			if (aFile.exists()) {
				return aFile;
			} else {
				throw (new Error('file [' + filesRoot.path + '/' + destDirPath
						+ '] does not exists'));
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
	},
	downloadFiles : function(files) {

		if (files) {
			this.filesToDownLoad = files;
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
		}

		if (file) {
			logTime("downloading the " + file.url + ": " + file.name);
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
					var percentComplete = (aCurTotalProgress / aMaxTotalProgress) * 100;
					/*
					 * var ele = document.getElementById("progress_element");
					 * ele.value = percentComplete + "%";
					 */
				},
				onStateChange : function(aWebProgress, aRequest, aStateFlags,
						aStatus) {
					/* var ele = document.getElementById("progress_element"); */
					if (aStateFlags == 327696) {
						logTime(file.name + 'downloaded');

						if (file.writable) {
							file.aFile.permissions = 0444;
						}
						me.saveFile(file);
						for ( var i = 0; i < me.filesToDownLoad.length; i++) {
							if (me.filesToDownLoad[i]
									&& (me.filesToDownLoad[i].url == file.url)) {
								// delete me.filesToDownLoad[i];
								me.filesToDownLoad.splice(i, 1);
								break;
							}
						}
						// me.filesToDownLoad.pop();
						// refreshProgressBar()
						logTime("file in queue: " + me.filesToDownLoad.length);
						me.downloadFiles();
					}
				}
			}
			persist.saveURI(obj_URI, null, null, null, "", file.aFile);
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
		logTime("storeFile", config);
		storageManager
				.execQuery({
					query : 'insert into '
							+ TABLE_FILES
							+ '("initid", "attrid", "index", "basename", "path", "writable")'
							+ ' values (:initid, :attrid, :index, :basename, :path, :writable)',
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
	if (config && config.url) {
		if (!config.aFile) {
			config.aFile = createTmpFile();
		}
		// FIXME: download file async
		// use addpending(config) before downloading
		// when download finishes
		// use storeFile(config) to register file in database
		// then remove file from pending downloads with removePending(config)
		return aFile;
	} else {
		throw "missing parameters";
	}
}

function createTmpFile() {
	var aFile = Services.dirsvc.get("TmpD", Ci.nsILocalFile);
	aFile.append("suggestedName.tmp");
	aFile.createUnique(aFile.NORMAL_FILE_TYPE, 0666);
	return aFile;
}

function addPending(config) {
	if (config && config.initid && config.attrid && config.index) {
		fileDwldProgress[initid] = fileDwldProgress[initid] || {};
		fileDwldProgress[initid][attrid] = fileDwldProgress[initid][attrid]
				|| {};
		fileDwldProgress[initid][attrid][index] = STATUS_PENDING;
	}
}

function removePending(config) {
	if (config && config.initid && config.attrid && config.index) {
		fileDwldProgress[initid] = fileDwldProgress[initid] || {};
		fileDwldProgress[initid][attrid] = fileDwldProgress[initid][attrid]
				|| {};
		fileDwldProgress[initid][attrid][index] = STATUS_DONE;
	}
}

function getPending(config) {
	if (config && config.initid && config.attrid && config.index) {
		if (fileDwldProgress[initid] && fileDwldProgress[initid][attrid]) {
			return fileDwldProgress[initid][attrid][index];
		} else {
			return STATUS_UNDEF;
		}
	}
}