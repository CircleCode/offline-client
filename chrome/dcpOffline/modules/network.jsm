const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");

var EXPORTED_SYMBOLS = ["networkChecker"];

var networkChecker = {
        isOffline : function() {
            try {
                var linkService = Cc["@mozilla.org/network/network-link-service;1"]
                .getService(Ci.nsINetworkLinkService);

                return !linkService.isLinkUp;
            } catch (e) {
                // The network link service might not be available
                var ioService = Cc["@mozilla.org/network/io-service;1"]
                .getService(Ci.nsIIOService);

                return ioService.offline;
            }
        }/*,
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
            logConsole('going offline');
        },
        goOnline : function() {
            logConsole('going online');
        }*/

};

/*Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService)
.addObserver(networkChecker.observe, "network:offline-status-changed",
        false);*/