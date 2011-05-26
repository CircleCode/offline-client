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
Cu.import("resource://modules/storageManager.jsm");
Cu.import("resource://modules/offlineSynchronize.jsm");
Cu.import("resource://modules/docManager.jsm");

/* Add window binding onLoad and onClose */
window.onload = function() {
    isServerOK();
    addObserver();
    initPage();
    initListeners();
}

function initPage() {
    var domainId = Preferences.get("offline.user.currentSelectedDomain", false);
    if (domainId) {
        updateDomain({domainId : domainId});
    }else {
        Services.prompt.alert(window, "synchronize.unable.title", translate
                .get("synchronize.unable"));
    }
}

function initListeners() {
    applicationEvent.subscribe("synchronize", synchronize, {caller : this});
    applicationEvent.subscribe("changeSelectedDomain", updateDomain, {caller : this});
    window.addEventListener("close", canBeClosed, false);
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
        },
        onAddDocumentsToRecord : function(t) {
            myAddDocumentsToRecord(t);
        },
        onAddDocumentsRecorded : function(t) {
            myAddDocumentsRecorded(t);
        },
        onAddFilesToRecord : function(t) {
            myAddFilesToRecord(t);
        },
        onAddFilesRecorded : function(t) {
            myAddFilesRecorded(t);
        },
        onAddDocumentsToSave : function(t) {
            myAddDocumentsToSave(t);
        },
        onAddDocumentsSaved : function(t) {
            myAddDocumentsSaved(t);
        },
        onAddFilesToSave : function(t) {
            myAddFilesToSave(t);
        },
        onAddFilesSaved : function(t) {
            myAddFilesSaved(t);
        },
        onAllFilesRecorded : function() {
            endSynchronize();
        }
    });
}

function appendText(text) {
    document.getElementById('progressMessages').value += text + "\n";
}

function isServerOK() {
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
    var translate = new StringBundle(
    "chrome://dcpoffline/locale/main.properties");
    if (Preferences.get("offline.user.currentSelectedDomain", false)) {
        var domain = context.getDocument({
            id : Preferences.get("offline.user.currentSelectedDomain")
        });
        offlineSync.synchronizeDomain({
            domain : domain
        });
    } else {
        Services.prompt.alert(window, "synchronize.domain", translate
                .get("synchronize.unable"));
        return false;
    }
}

function updateDomain(config) {
    if (config && config.domainId) {
        var currentDomain = storageManager.getDomainValues({domainid : config.domainId});
        try {
            document.getElementById('currentLabelId').value = currentDomain.description;
        } catch(e) {
            Services.prompt.alert(window, "synchronize.domain", e);
        }
    }
}

function tryToSynchronize() {
    document.getElementById("synchronizeButton").disabled = true;
    document.getElementById("cancelButton").disabled = true;
    if (!applicationEvent.publish("preSynchronize")) {
        // TODO add alert message
        alert("unable to synchronize");
    } else {
        if (applicationEvent.publish("synchronize")) {
            
        } else {
            //TODO add log
        }
    }
    
}

function endSynchronize() {
    applicationEvent.publish("postSynchronize");
    var translate = new StringBundle(
    "chrome://dcpoffline/locale/main.properties");
    document.getElementById("cancelButton").label = translate.get("synchronize.endOfSynchronization");
    document.getElementById("cancelButton").disabled = false;
}

function canBeClosed(event) {
    if (document.getElementById("cancelButton").disabled) {
        event.preventDefault();
    }
    else {
        letClose();
    }
}

function letClose() {
    applicationEvent.unsubscribe("synchronize", synchronize);
    applicationEvent.unsubscribe("synchronize", updateDomain);
    window.close();
}

/*Update IHM*/
function myAddDocumentsToRecord(delta) {
    var r = document.getElementById('documentsToRecord');
    r.value = parseInt(r.value) + delta;
};

function myAddDocumentsRecorded(delta) {
    var r = document.getElementById('documentsRecorded');
    r.value = parseInt(r.value) + delta;

};
function myAddFilesToRecord(delta) {

    var r = document.getElementById('filesToRecord');
    r.value = parseInt(r.value) + delta;
};

function myAddFilesRecorded(delta) {

    var r = document.getElementById('filesRecorded');
    r.value = parseInt(r.value) + delta;
};

function myAddDocumentsToSave(delta) {
    var r = document.getElementById('documentsToSave')
    r.value = parseInt(r.value) + delta;
};

function myAddDocumentsSaved(delta) {
    var r = document.getElementById('documentsSaved');
    r.value = parseInt(r.value) + delta;
};
function myAddFilesToSave(delta) {
    var r = document.getElementById('filesToSave');
    r.value = parseInt(r.value) + delta;
};

function myAddFilesSaved(delta) {

    var r = document.getElementById('filesSaved');
    r.value = parseInt(r.value) + delta;
};
