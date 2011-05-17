Components.utils.import("resource://modules/logger.jsm");

log('Synchro');

Components.utils.import("resource://modules/docManager.jsm");
Components.utils.import("resource://modules/storageManager.jsm");
Components.utils.import("resource://modules/fdl-context.jsm");
Components.utils.import("resource://modules/fdl-data-debug.jsm");
Components.utils.import("resource://modules/offline-debug.jsm");

// Components.utils.import("chrome://dcpoffline/content/fdl-data-debug.js");

var EXPORTED_SYMBOLS = [ "offlineSync" ];

function offlineSynchronize(config) {

};

offlineSynchronize.prototype = {
	offlineCore : null,
	toString : function() {
		return 'offlineSynchronize';
	}
};

offlineSynchronize.prototype = {
	getCore : function() {
		if (!this.offlineCore) {
			this.offlineCore = new Fdl.OfflineCore({
				context : context
			});

			log('core synv' + typeof this.offlineCore
					+ this.offlineCore.toString());
		}

		return this.offlineCore;
	}
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

offlineSynchronize.prototype.synchronizeDomain = function(domain) {
	// TODO record suchro date in domain table
	this.recordFamilies(domain);
	var modifiedDocs = this.getModifiedDocs();
	for ( var i = 0; i < modifiedDocs.length; i++) {
		this.pushDocument(domain, modifiedDocs[i]);
	}
	this.pullDocuments(domain);
};
offlineSynchronize.prototype.recordFamilies = function(domain) {
	logTime('recordFamilies ');

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
};

offlineSynchronize.prototype.getModifiedDocs = function(domain) {
	return []; // TODO search in database
};

offlineSynchronize.prototype.pushDocument = function(domain, document) {

	// TODO put document and modifies files
};

offlineSynchronize.prototype.isEditable = function(domain, document) {
	// log2(document.id+' --'+domain.id +
	// '='+document.getProperty('lockdomainid')+':'+document.getProperty('locked')+'='+document.context.getUser().id);
	if (document.getProperty('lockdomainid') != domain.getProperty('id'))
		return false;
	if (document.getProperty('locked') != document.context.getUser().id)
		return false;

	return true;
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
		logTime('global '+p);
	}
};
offlineSynchronize.prototype.detailLabel = function(t) {
	if (this.progress && this.progress.label) {
		this.progress.label.setAttribute('label', t);
	}
};

offlineSynchronize.prototype.twoDigits = function(n) {
	if (n > 9)
		return n.toString();
	else
		return '0' + n.toString();
};
offlineSynchronize.prototype.toIso8601 = function(now) {
	return now.getFullYear() + '-' + this.twoDigits(now.getMonth() + 1) + '-'
			+ this.twoDigits(now.getDate()) + 'T'
			+ this.twoDigits(now.getHours()) + ':'
			+ this.twoDigits(now.getMinutes()) + ':'
			+ this.twoDigits(now.getSeconds());

};
offlineSynchronize.prototype.pullDocuments = function(domain) {

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
	var clientDate = this.toIso8601(now);

	this.detailLabel('recording shared documents : ' + shared.length);
	logTime('pull shared : ' + shared.length + ':' + serverDate + '--'
			+ clientDate);
	var onedoc = null;
	var j = 0;
	for (j = 0; j < shared.length; j++) {
		onedoc = shared.getDocument(j);

		storageManager.saveDocumentValues({
			properties : onedoc.getProperties(),
			attributes : onedoc.getValues()
		});

		// storage in domain doc table also

		storageManager
				.execQuery({
					query : "insert into docsbydomain(initid, domainid, editable) values (:initid, :domainid, :editable)",
					params : {
						initid : onedoc.getProperty('initid'),
						domainid : domain.getProperty('initid'),
						editable : this.isEditable(domain, onedoc)
					}
				});
		/*
		 * docsDomainQuery += "insert into docsbydomain(initid, domainid,
		 * editable) values (" + onedoc.getProperty('initid') + ',' +
		 * domain.getProperty('initid') + ',' + (this.isEditable(domain, onedoc) ?
		 * 1 : 0) + ');';
		 */
		logTime('store : ' + onedoc.getTitle());
		this.detailPercent((j+1) / shared.length * 100);
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
		logTime('store : ' + onedoc.getTitle());
		storageManager.saveDocumentValues({
			properties : onedoc.getProperties(),
			attributes : onedoc.getValues()
		});
		// storage in domain doc table also

		storageManager
				.execQuery({
					query : "insert into docsbydomain(initid, domainid, editable) values (:initid, :domainid, :editable)",
					params : {
						initid : onedoc.getProperty('initid'),
						domainid : domain.getProperty('initid'),
						editable : this.isEditable(domain, onedoc)
					}
				});
		this.detailPercent((j+1) / userd.length * 100);
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
	storageManager.lockDatabase({
		lock : false
	});
	logTime('synchrotimes : ');
	this.globalPercent(100);
};

log('End Synchro');

var offlineSync = new offlineSynchronize();