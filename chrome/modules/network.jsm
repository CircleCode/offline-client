Components.utils.import("resource://modules/logger.jsm");

var EXPORTED_SYMBOLS = ["networkChecker"];

networkChecker = {
	isOffline : function() {
		try {
			var linkService = Components.classes["@mozilla.org/network/network-link-service;1"]
					.getService(Components.interfaces.nsINetworkLinkService);

			log('online status given by nsINetworkLinkService: '
					+ (linkService.isLinkUp ? 'online' : 'offline'));

			return !linkService.isLinkUp;
		} catch (e) {
			// The network link service might not be available
			var ioService = Components.classes["@mozilla.org/network/io-service;1"]
					.getService(Components.interfaces.nsIIOService);

			// it seems ioService.offline is never set automatically!
			log('online status given by nsIIOService: '
					+ (ioService.offline ? 'offline' : 'online'));

			return ioService.offline;
		}
	},
	observe : function(aSubject, aTopic, aState) {
		if (aTopic == "network:offline-status-changed") {
			if (aState == "online") {
				networkChecker.goOnline();
				return true;
			} else {
				networkChecker.goOffline();
				return false;
			}
		}
	},
	goOffline : function() {
		log('going offline');
	},
	goOnline : function() {
		log('going online');
	}

};

Components.classes["@mozilla.org/observer-service;1"]
		.getService(Components.interfaces.nsIObserverService)
		.addObserver(networkChecker.observe, "network:offline-status-changed",
				false);

log('network module loaded');
log('network status is: ' + (networkChecker.isOffline() ? 'offline' : 'online'));
log('network status is: ' + (networkChecker.isOffline() ? 'offline' : 'online'));