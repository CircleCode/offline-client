/**
 * Beware don't use const define here !!!!
 */

Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/network.jsm");
Components.utils.import("resource://modules/preferences.jsm");
Components.utils.import("resource://modules/events.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://modules/fdl-context.jsm");
Components.utils.import("resource://modules/StringBundle.jsm");
Components.utils.import("resource://modules/storageManager.jsm");
Components.utils.import("resource://modules/offlineSynchronize.jsm");
Components.utils.import("resource://modules/docManager.jsm");

function initSynchronize() {
    isServerOK();
    addObserver();
    initPage();
    initListeners();
}

function isServerOK() {
    var translate = new StringBundle(
            "chrome://dcpoffline/locale/main.properties");
    if (!networkChecker.isOffline() && context.isAuthenticated()) {
        logConsole("Ready to synchronize");
    } else {
        logConsole("Ready to synchronize");
        document.getElementById("synchronizeButton").disabled = true;
        applicationEvent.publish("unableToSynchronize",{reason : translate.get("synchronize.notConnected")});
    }
};

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
        onSuccess : function(result) {
            endSynchronize(result);
        },
        onError : function(result) {
            errorOfSynchronize(result);
        }
    });
}

function initPage() {
    var translate = new StringBundle(
    "chrome://dcpoffline/locale/main.properties");
    var domainId = Preferences.get("offline.user.currentSelectedDomain", false);
    if (domainId) {
        updateDomain({domainId : domainId});
    }else {
        applicationEvent.publish("unableToSynchronize",{reason : translate.get("synchronize.noDomainSelected")});
    }
};

function initListeners() {
    applicationEvent.subscribe("synchronize", synchronize, {onError : errorOfSynchronize});
    applicationEvent.subscribe("changeSelectedDomain", updateDomain);
    window.addEventListener("close", canBeClosed, false);
};

function synchronize() {
    var translate = new StringBundle(
    "chrome://dcpoffline/locale/main.properties");
    if (Preferences.get("offline.user.currentSelectedDomain", false)) {
        var domain = context.getDocument({
            id : Preferences.get("offline.user.currentSelectedDomain")
        });
        document.getElementById('progress').mode = 'undetermined';
        offlineSync.synchronizeDomain({
            domain : domain
        });
    } else {
        applicationEvent.publish("unableToSynchronize",{reason : translate.get("synchronize.noDomainSelected")});
        return false;
    }
};

function updateDomain(config) {
    if (config && config.domainId) {
        var currentDomain = storageManager.getDomainValues({domainid : config.domainId});
        try {
            document.getElementById('currentLabelId').value = currentDomain.description;
        } catch(e) {
            Services.prompt.alert(window, "synchronize.unableToDisplayDomainDescription", e);
        }
    }
};

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
    
};

function endSynchronize(result) {
    document.getElementById('progress').value = 100;
    document.getElementById('progress').mode = 'determined';
    applicationEvent.publish("postSynchronize", {result : true, description : result});
    document.getElementById("cancelButton").disabled = false;
};

function errorOfSynchronize(result) {
    document.getElementById('progress').value = 100;
    document.getElementById('progress').mode = 'determined';
    applicationEvent.publish("postSynchronize", {result : false, description : result});
    document.getElementById("cancelButton").disabled = false;
};

/*Close IHM*/
function canBeClosed(event) {
    if (document.getElementById("cancelButton").disabled) {
        event.preventDefault();
    }
    else {
        letClose();
    }
};

function letClose() {
    applicationEvent.unsubscribe("synchronize", synchronize);
    applicationEvent.unsubscribe("changeSelectedDomain", updateDomain);
    window.close();
};

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
    var r = document.getElementById('documentsToSave');
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

function appendText(text) {
    document.getElementById('progressMessages').value += text + "\n";
}
