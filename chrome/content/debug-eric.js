// start_venkman();
Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/docManager.jsm");

Components.utils.import("resource://modules/storageManager.jsm");
Components.utils.import("resource://modules/fdl-context.jsm");
Components.utils.import("resource://modules/fdl-data-debug.jsm");
Components.utils.import("resource://modules/offlineSynchronize.jsm");

function initEricContext() {
	context.url = 'http://localhost/eric/';

	if (!context.isAuthenticated()) {
		var u = context.setAuthentification({
			login : 'nono',
			password : 'anakeen'
		});
		if (!u)
			alert('error authent:' + context.getLastErrorMessage());
		logTime(u.lastname + ' is log in');
	}

}

function clicPullDomain(domainid) {
	//var initCore=new Fdl.OfflineCore({context:context}); // need init mapping Fdl core
	var domain=context.getDocument({id:domainid});
	if (domain) {
	offlineSync.setProgressElements({
		global : document.getElementById('progressGlobal'),
		detail : document.getElementById('progressDetail'),
		label : document.getElementById('detailLabel'),
		documentsToRecord : document.getElementById('documentsToRecord'),
		documentsRecorded : document.getElementById('documentsRecorded'),
		filesToRecord : document.getElementById('filesToRecord'),
		filesRecorded : document.getElementById('filesRecorded')
	});
	var label = document.getElementById('domain');
	
		label.value =  domain.getTitle();
		offlineSync.synchronizeDomain(domain);
	
	label.value += "\n FINISH";
	} else {
		throw "clicPullDomain no domain";
	}
}

function clicPushDomain(domainid) {
	//var initCore=new Fdl.OfflineCore({context:context}); // need init mapping Fdl core
	var domain=context.getDocument({id:domainid});
	if (domain) {
	offlineSync.setProgressElements({
		global : document.getElementById('progressGlobal'),
		detail : document.getElementById('progressDetail'),
		label : document.getElementById('detailLabel'),
		documentsToSaved : document.getElementById('documentsToSaved'),
		documentsSaved : document.getElementById('documentsSaved'),
		filesToSaved : document.getElementById('filesToSaved'),
		filesSaved : document.getElementById('filesSaved')
	});
	var label = document.getElementById('domain');
	
		label.value =  domain.getTitle();
		offlineSync.pushDocuments(domain);
	
	label.value += "\n FINISH";
	} else {
		throw "clicPushDomain no domain";
	}
}

function clicGetDomains() {
	var sdomains=document.getElementById('sdomains');
	var boxDomain=document.getElementById('boxDomain');
	var domains = offlineSync.recordOfflineDomains();
	var onedom = null;
	for ( var i = 0; i < domains.length; i++) {
		onedom = domains.getDocument(i);
		sdomains.options[sdomains.options.length] = new Option ( onedom.getTitle(), onedom.id);
		
	}
	boxDomain.style.visibility='visible';

}

function clicPullEverythings() {
	offlineSync.setProgressElements({
		global : document.getElementById('progressGlobal'),
		detail : document.getElementById('progressDetail'),
		label : document.getElementById('detailLabel'),
		documentsToRecord : document.getElementById('documentsToRecord'),
		documentsRecorded : document.getElementById('documentsRecorded'),
		filesToRecord : document.getElementById('filesToRecord'),
		filesRecorded : document.getElementById('filesRecorded')
	});
	var label = document.getElementById('domain');
	var domains = offlineSync.recordOfflineDomains();
	var onedom = null;
	for ( var i = 0; i < domains.length; i++) {
		onedom = domains.getDocument(i);
		label.value += "\n--" + onedom.getTitle();
		offlineSync.synchronizeDomain(onedom);
	}
	label.value += "\nFINISH";

}
