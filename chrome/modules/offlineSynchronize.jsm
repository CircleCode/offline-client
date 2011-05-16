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
			log(context,'the context');
			log('core synv' + typeof this.offlineCore+ this.offlineCore.toString());
		}
		
		return this.offlineCore;
	}
};
offlineSynchronize.prototype.recordOfflineDomains = function(config) {
	var domains = this.getCore().getOfflineDomains();
	log('domains');
	log(domains);
};

log('End Synchro');

var offlineSync = new offlineSynchronize();