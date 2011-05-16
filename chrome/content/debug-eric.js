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
		log(u.lastname+' is log in');
	}

	storageManager.execQuery({
		query : "delete from families"
	});
}
function clicOfflineDomains() {
	
	
	var domains=offlineSync.recordOfflineDomains();
	for (var i =0 ; i< domains.length; i++) {
		offlineSync.synchronizeDomain(domains.getDocument(i));
	}
}

function clicGetAvailableFamilies() {
	alert('clicGetAvailableFamilies');
	var av = offlineSync.getAvailableFamilies();
	
}