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
        }

};

/*Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService)
.addObserver(networkChecker.observe, "network:link-status-changed",
        false);*/
