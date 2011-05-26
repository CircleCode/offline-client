const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");

var EXPORTED_SYMBOLS = ["networkChecker"];

var networkChecker = {
        isOffline : function() {
            try {
                var linkService = Components.classes["@mozilla.org/network/network-link-service;1"]
                .getService(Components.interfaces.nsINetworkLinkService);

                logConsole('online status given by nsINetworkLinkService: '
                        + (linkService.isLinkUp ? 'online' : 'offline'));
                
                logConsole(linkService.isLinkUp);

                return !linkService.isLinkUp;
            } catch (e) {
                // The network link service might not be available
                var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);

                // it seems ioService.offline is never set automatically!
                logConsole('online status given by nsIIOService: '
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
            logConsole('going offline');
        },
        goOnline : function() {
            logConsole('going online');
        }

};

Components.classes["@mozilla.org/observer-service;1"]
.getService(Components.interfaces.nsIObserverService)
.addObserver(networkChecker.observe, "network:offline-status-changed",
        false);

logConsole('network module loaded');
logConsole('network status is: ' + (networkChecker.isOffline() ? 'offline' : 'online'));
logConsole('network status is: ' + (networkChecker.isOffline() ? 'offline' : 'online'));