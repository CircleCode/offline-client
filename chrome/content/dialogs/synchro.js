const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/network.jsm");
Cu.import("resource://modules/preferences.jsm");
Cu.import("resource://modules/events.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://modules/fdl-context.jsm");
Cu.import("resource://modules/StringBundle.jsm");
Cu.import("resource://modules/offlineSynchronize.jsm");

Components.utils.import("resource://modules/docManager.jsm");

/* Add window binding onLoad and onClose */
window.onload = function() {
    isServerAvalaible();
    addObserver();
    addListener();
}

function addListener() {
    applicationEvent.subscribe("synchronize", synchronize);
}

function addObserver() {
    offlineSync.setObservers({
        onDetailPercent : function(p) {
            document.getElementById('progressDetail').value = p;
        },
        onGlobalPercent : function(p) {
            document.getElementById('progressGlobal').value = p;
        },
        onDetailLabel : function(t) {
            appendText(t);
        }
        /*onAddDocumentsToRecord : function(t) {
            appendText(t);
        },
        onAddDocumentsRecorded : function(t) {
            appendText(t);
        },
        onAddFilesToRecord : function(t) {
            appendText(t);
        },
        onAddFilesRecorded : function(t) {
            appendText(t);
        },
        onAddDocumentsToSave : function(t) {
            appendText(t);
        },
        onAddDocumentsSaved : function(t) {
            appendText(t);
        },
        onAddFilesToSave : function(t) {
            appendText(t);
        },
        onAddFilesSaved : function(t) {
            appendText(t);
        }*/
    });
}

function appendText(text) {
    document.getElementById('progressMessages').value += text + "\n";
}

function isServerAvalaible() {
    var translate = new StringBundle(
            "chrome://dcpoffline/locale/main.properties");
    if (!networkChecker.isOffline() && context.isAuthenticated()) {
        logConsole("Ready to synchronize");
    } else {
        document.getElementById("synchronizeButton").disabled = true;
        Services.prompt.alert(window, "synchronize.unable.title", translate
                .get("synchronize.unable"));
    }
}

function synchronize() {
    logConsole("Synchronize let's go !!");
    var translate = new StringBundle(
    "chrome://dcpoffline/locale/main.properties");
    if (Preferences.get("offline.user.currentSelectedDomain", false)) {
        logConsole("Synchronize let's go !! go ! go !");
        logConsole(docManager.getActiveDomain());
        var domain = context.getDocument({
            id : Preferences.get("offline.user.currentSelectedDomain")
        });
        offlineSync.synchronizeDomain({
            domain : domain
        });
        logConsole("Synchronize OK !");
    } else {
        Services.prompt.alert(window, "synchronize.domain", translate
                .get("synchronize.unable"));
        return false;
    }

}

function tryToSynchronize() {
    if (!applicationEvent.publish("preSynchronize")) {
        // TODO add alert message
        alert("unable to synchronize");
    } else {
        if (applicationEvent.publish("synchronize")) {
            applicationEvent.publish("postSynchronize");
        } else {
            //TODO add log
        }
    }
}
