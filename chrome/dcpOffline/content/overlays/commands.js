Components.utils.import("resource://modules/storageManager.jsm");
Components.utils.import("resource://modules/preferences.jsm");

/**
 * Open the synchro dialog Private method : you should never use it
 *
 * @private
 */
function openSynchro() {
    window.openDialog("chrome://dcpoffline/content/dialogs/synchro.xul", "",
            "chrome,modal");
}
/**
 * Open the preferences dialog Private method : you should never use it
 *
 * @private
 */
function openPreferences() {
    window.openDialog("chrome://dcpoffline/content/dialogs/preferences.xul",
            "", "chrome,titlebar,toolbar,centerscreen,modal");
}

/**
 * Open the close dialog Private method : you should never use it
 *
 * @private
 */
function openCloseDialog() {
    /*
     * window.openDialog("chrome://dcpoffline/content/dialogs/close.xul", "",
     * "chrome,modal");
     */
    tryToClose();
}

function checkForUpdate() {
    var um = Components.classes["@mozilla.org/updates/update-service;1"]
            .getService(Components.interfaces.nsIUpdateManager);
    var prompter = Components.classes["@mozilla.org/updates/update-prompt;1"]
            .createInstance(Components.interfaces.nsIUpdatePrompt);

    if (um.activeUpdate && um.activeUpdate.state == "pending") {
        prompter.showUpdateDownloaded(um.activeUpdate);
    } else {
        prompter.checkForUpdates();
    };
};

/**
 * Get the current selected domain
 *
 * Private method : you should never use it
 *
 * @private
 */
function getCurrentDomain() {
    return Preferences.get("offline.user.currentSelectedDomain", "");
}

/**
 * Open the about dialog Private method : you should never use it
 *
 * @private
 */
function openAbout() {
    window.openDialog("chrome://dcpoffline/content/dialogs/about.xul", "",
    "chrome,modal");
}

function openLocalExternal(aFile) {
    var uri = Components.classes["@mozilla.org/network/io-service;1"].getService(
            Components.interfaces.nsIIOService).newFileURI(aFile);

    var protocolSvc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
            .getService(Components.interfaces.nsIExternalProtocolService);
    protocolSvc.loadUrl(uri);

    return;
}

function openLocalFile(localFile) {
    try {
        localFile.launch();
    } catch (ex) {
        // if launch fails, try sending it through the system's external
        // file: URL handler
        openLocalExternal(localFile);
        
    }
}
function openSynchroReport(domainName){
    if(!domainName){
        var domainId = getCurrentDomain();
        var r=storageManager
                .execQuery({
                    query : "select * from domains where id=:domainid",
                        params:{
                            domainid:domainId
                        }
                });
        if (r.length == 1) {
            domainName = r[0].name;
        } else {
            logIHM("openSynchroReport : could not get domain name (domain id is "+domainId+')');
        };
    };
    var reportFile = Components.classes["@mozilla.org/file/directory_service;1"]
            .getService(Components.interfaces.nsIProperties)
            .get("ProfD", Components.interfaces.nsILocalFile);
    reportFile.append('Logs');
    reportFile.append('report-' + domainName + '.html');
    if(reportFile.exists()){
        openLocalFile(reportFile);
    } else {
        logIHM("openSynchroReport : report file does not exists: " + reportFile.path);
    };
};