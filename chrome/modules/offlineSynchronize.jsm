Components.utils.import("resource://modules/logger.jsm");

log('Synchro');
Components.utils.import("resource://gre/modules/ISO8601DateUtils.jsm");

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
					query : "insert into domains(id, name, description, mode,  transactionPolicies, sharePolicies, iAmAdmin) values(:initid, :name, :description, :mode,  :transactionPolicies, :sharePolicies, :iAmAdmin)",
					params : {
						initid : domain.getProperty('initid'),
						name : domain.getProperty('initid'),
						description : domain.getTitle(),
						mode : 'mode',
						transactionPolicies : domain
								.getValue('off_transactionpolicy'),
						sharePolicies : domain.getValue('off_sharepolicy'),
						iAmAdmin : false
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
	logTime('pull famlilies : ');

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
		log("record family :" + fam.getTitle());
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

offlineSynchronize.prototype.pullDocuments = function(domain) {

	// TODO pull all documents and modifies files
var now=new Date();
	logTime('pull : ');
	var shared = domain.sync().getSharedDocuments({
	// until : '2011-05-01 13:00'
	});
    var serverDate=shared.date.replace(" ","T");
	logTime('pull shared : ' + shared.length + ':'+ serverDate);
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
	}
	// var dbcon=storageManager.getDbConnection();
	// dbcon.executeSimpleSQL(docsDomainQuery);
	// logTime('docsDomain : '+docsDomainQuery);

	var userd = domain.sync().getUserDocuments({
	// until : '2011-05-01 13:00'
	});

	logTime('pull users : ' + userd.length);
	for (j = 0; j < userd.length; j++) {
		onedoc = userd.getDocument(j);
		logTime('store : ' + onedoc.getTitle());
		storageManager.saveDocumentValues({
			properties : onedoc.getProperties(),
			attributes : onedoc.getValues()
		});
	}
	var nowString = ISO8601DateUtils.create(now);
	storageManager
			.execQuery({
				query : "insert into synchrotimes (initid, lastsyncremote, lastsynclocal, lastsyncsave) select initid , :serverDate, :clientDate , :clientDate from documents",
				params : {clientDate: nowString, serverDate:serverDate}
			});
	logTime('synchrotimes : ');
};

log('End Synchro');

var offlineSync = new offlineSynchronize();