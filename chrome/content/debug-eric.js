// start_venkman();
Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/docManager.jsm");
// Components.utils.import("chrome://dcpoffline/content/logger.jsm");

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
}
function clicOfflineDomains() {
	alert(offlineSync.toString());
	log(context, 'context in clic');
	var av = offlineSync.recordOfflineDomains();
}

function clicGetAvailableFamilies() {
	alert('clicGetAvailableFamilies');
	var av = offlineSync.getAvailableFamilies();
	
}