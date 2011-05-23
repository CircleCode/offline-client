Components.utils.import("resource://modules/logger.jsm");

log('Synchro');

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
	offlineCore : null,
	recordFilesInProgress : false,
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
		log('domain :' + domain.getTitle());
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
		// TODO record suchro date in domain table
		this.recordFamilies({
			domain : domain
		});
		
		//this.pushDocuments({domain:domain});
		this.pullDocuments({domain:domain});
	} else {
		throw new ArgException("synchronizeDomain need domain parameter");
	}
};
offlineSynchronize.prototype.recordFamilies = function(config) {
	logTime('recordFamilies ');

	if (config && config.domain) {
		var domain = config.domain;
		var families = domain.getAvailableFamilies();
		logTime('pull families : ');

		var fam = null;
		for ( var i = 0; i < families.length; i++) {
			fam = families.getDocument(i);
			storageManager
					.execQuery({
						query : "insert into families(famid, name, json_object) values(:famid, :famname, :fam)",
						params : {
							famid : fam.getProperty('id'),
							famname : fam.getProperty('name'),
							fam : JSON.stringify(fam)
						}
					});
			// view generation
			storageManager.initFamilyView(fam);
			logTime("record family :" + fam.getTitle());
		}
	} else {
		throw new ArgException("recordFamilies need domain parameter");
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
			var updateDocument = domain.sync().pushDocument({
				context : domain.context,
				document : document
			});
			
			if (!updateDocument) {
				throw "pushDocument:" + domain.context.getLastErrorMessage();
			} else {
				this.addDocumentsSaved(1);
			}
		} else {
			throw "pushDocument: no document";
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
 *            global, detail, label
 */
offlineSynchronize.prototype.setProgressElements = function(config) {
	if (config) {
		this.progress = {};
		for ( var i in config)
			this.progress[i] = config[i];
	}
};
offlineSynchronize.prototype.detailPercent = function(p) {
	if (this.progress && this.progress.detail) {
		this.progress.detail.value = p;
	}
};

offlineSynchronize.prototype.globalPercent = function(p) {
	if (this.progress && this.progress.global) {
		this.progress.global.value = p;
	}
};
offlineSynchronize.prototype.detailLabel = function(t) {
	if (this.progress && this.progress.label) {
		this.progress.label.setAttribute('label', t);
	}
};
offlineSynchronize.prototype.addDocumentsToRecord = function(delta) {
	if (this.progress && this.progress.documentsToRecord) {
		this.progress.documentsToRecord.value = parseInt(this.progress.documentsToRecord.value)
				+ delta;
	}
};

offlineSynchronize.prototype.addDocumentsRecorded = function(delta) {
	if (this.progress && this.progress.documentsRecorded) {
		this.progress.documentsRecorded.value = parseInt(this.progress.documentsRecorded.value)
				+ delta;
	}
};
offlineSynchronize.prototype.addFilesToRecord = function(delta) {
	if (this.progress && this.progress.filesToRecord) {
		this.progress.filesToRecord.value = parseInt(this.progress.filesToRecord.value)
				+ delta;
	}
};

offlineSynchronize.prototype.addFilesRecorded = function(delta) {
	if (this.progress && this.progress.filesRecorded) {
		this.progress.filesRecorded.value = parseInt(this.progress.filesRecorded.value)
				+ delta;
	}
};

offlineSynchronize.prototype.addDocumentsToSave = function(delta) {
	if (this.progress && this.progress.documentsToSave) {
		this.progress.documentsToSave.value = parseInt(this.progress.documentsToSave.value)
				+ delta;
	}
};

offlineSynchronize.prototype.addDocumentsSaved = function(delta) {
	if (this.progress && this.progress.documentsSaved) {
		this.progress.documentsSaved.value = parseInt(this.progress.documentsSaved.value)
				+ delta;
	}
};
offlineSynchronize.prototype.addFilesToSave = function(delta) {
	if (this.progress && this.progress.filesToSave) {
		this.progress.filesToSave.value = parseInt(this.progress.filesToSave.value)
				+ delta;
	}
};

offlineSynchronize.prototype.addFilesSaved = function(delta) {
	if (this.progress && this.progress.filesSaved) {
		this.progress.filesSaved.value = parseInt(this.progress.filesSaved.value)
				+ delta;
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
									this.addFilesToRecord(1);
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
							this.addFilesToRecord(1);
						}
					}
				}
			}
		}
	} else {
		throw new ArgException("pendingFiles need domain, document parameter");
	}
};
/**
 * 
 */
offlineSynchronize.prototype.recordFiles = function() {
	if (!this.recordFilesInProgress) {
		logTime('recordFilesInProgress');
		if (this.filesToDownload.length > 0) {
			var me = this;
			this.recordFilesInProgress = true;

			fileManager.downloadFiles({
				files : this.filesToDownload,
				acquitFileCallback : function() {
					me.addFilesRecorded(1);
				},
				completeFileCallback : function() {
					logTime('end files', this.filesToDownload);

					me.recordFilesInProgress = false;
					fileManager.initModificationDates();
				}
			});
		}
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
		this.addDocumentsToRecord(1);
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
												me.addDocumentsRecorded(1);
												me.updateSyncDate({document:document});
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
		 * logTime("return from a callback");
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
		logTime('pull : ');

		storageManager.lockDatabase({
			lock : true
		});

		this.detailPercent(0);
		this.globalPercent(0);
		this.detailLabel(domain.getTitle() + ':get shared documents');
		var shared = domain.sync().getSharedDocuments({
		// until : '2011-05-01 13:00'
		});
		this.globalPercent(10);
		var serverDate = shared.date.replace(" ", "T");
		var clientDate = utils.toIso8601(now);

		this.detailLabel('recording shared documents : ' + shared.length);
		logTime('pull shared : ' + shared.length + ':' + serverDate + '--'
				+ clientDate);
		var onedoc = null;
		var j = 0;
		for (j = 0; j < shared.length; j++) {
			onedoc = shared.getDocument(j);
			this.recordDocument({
				domain : domain,
				document : onedoc
			});
			logTime('store : ' + onedoc.getTitle());
			this.detailPercent((j + 1) / shared.length * 100);
		}
		this.detailPercent(100);
		this.globalPercent(50);
		// var dbcon=storageManager.getDbConnection();
		// dbcon.executeSimpleSQL(docsDomainQuery);
		// logTime('docsDomain : '+docsDomainQuery);
		this.detailLabel(domain.getTitle() + ':get user documents');
		var userd = domain.sync().getUserDocuments({
		// until : '2011-05-01 13:00'
		});

		this.globalPercent(60);
		this.detailLabel('recording user documents : ' + userd.length);
		logTime('pull users : ' + userd.length);
		for (j = 0; j < userd.length; j++) {
			onedoc = userd.getDocument(j);
			this.recordDocument({
				domain : domain,
				document : onedoc
			});
			this.detailPercent((j + 1) / userd.length * 100);
		}
		this.globalPercent(90);
		storageManager
				.execQuery({
					query : "insert into synchrotimes (initid, lastsyncremote, lastsynclocal, lastsavelocal) select initid , :serverDate, :clientDate , :clientDate from documents",
					params : {
						clientDate : clientDate,
						serverDate : serverDate
					}
				});

		this.recordFiles();

		storageManager.lockDatabase({
			lock : false
		});
		// logTime('synchrotimes : ', this.filesToDownload);

		this.globalPercent(100);
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
			query : "update synchrotimes set lastsyncremote=:serverDate, lastsynclocal=:clientDate, lastsavelocal=:clientDate where initid=:initid",
			params : {
				clientDate : clientDate,
				serverDate : serverDate,
				initid:config.document.getProperty('initid')
			}
		});
	}else {
		throw new ArgException("updateSyncDate need document parameter");
	}
};
offlineSynchronize.prototype.revertDocument = function(config) {

	if (config && config.domain && config.initid) {
		

		var domain = config.domain;
		var document = domain.sync().revertDocument({document:{id:config.initid}});
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
}
/**
 * 
 * @param domain
 */
offlineSynchronize.prototype.pushDocuments = function(config) {
	if (config && config.domain) {
		var domain = config.domain;
	this.globalPercent(0);
	docManager.setActiveDomain({
		domain : domain.id
	});
	logTime("active domain" + docManager.getActiveDomain());
	// update file modification date
	var modifiedFiles = fileManager.getModifiedFiles({
		domain : domain.id
	});
	var modifiedDocs = this.getModifiedDocs({
		domain : domain
	});
	var ldoc;
	this.addFilesToSave(modifiedFiles.length);
	this.addDocumentsToSave(modifiedDocs.length);
	var tid = domain.sync().beginTransaction();
	if (tid) {
		for ( var i = 0; i < modifiedDocs.length; i++) {
			ldoc = modifiedDocs.getLocalDocument(i);
			logTime("mod doc:" + ldoc.getTitle());
			try {
				this.pushDocument({
					domain : domain,
					localDocument : ldoc
				});
			} catch (e) {
				// need to log here errors TODO
				// into the log
			}
		}
		var thisIsTheEnd = domain.sync().endTransaction();
		if (thisIsTheEnd) {
			var results = domain.sync().getTransactionStatus();
			logTime('final Results', results);
			for ( var docid in results.detailStatus) {
				if (results.detailStatus[docid].isValid) {
					// update local document
					this.revertDocument({
						domain: domain,
						initid : docid
					});
				}
			}
		}
	} else {
		throw "no transaction set:" + domain.context.getLastErrorMessage();
	}
	logTime('mod files', modifiedFiles);
	} else {
		throw new ArgException("pushDocuments need domain parameter");
	}
};
log('End Synchro');

var offlineSync = new offlineSynchronize();