const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/exceptions.jsm");
Cu.import("resource://modules/docManager.jsm");
Cu.import("resource://modules/network.jsm");
Cu.import("resource://modules/events.jsm");
Cu.import("resource://modules/preferences.jsm");
Cu.import("resource://modules/fdl-context.jsm");
Cu.import("resource://modules/StringBundle.jsm");
Cu.import("resource://gre/modules/Services.jsm");

/* init elements */
/* Add window binding onLoad and onClose */
window.onload = function() {
    window.setTimeout(function(){
        try{
            initNetworkCheck();
            initListeners();
            upgradeProfile();
            initApplication();
        } catch(e) {
            logError(e, "application could not initialize - exiting\n");
            applicationEvent.publish("askForCloseApplication");
        };
    }, 100);
}
/**
 * Check if the profile need upgrade
 * 
 * @private
 */
function upgradeProfile(){
    // compare current profile version against application version
    var xulAppInfo = Components.classes["@mozilla.org/xre/app-info;1"]
    .getService(Components.interfaces.nsIXULAppInfo);
    var appVersion = xulAppInfo.version;
    var profileVersion = Preferences.get('offline.application.profileVersion', 0);

    var versionComparator = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
    .getService(Components.interfaces.nsIVersionComparator);
    var profileNeedUpgrade = versionComparator.compare(appVersion, profileVersion) > 0;

    // launch migration functions if needed
    if(profileNeedUpgrade){
        try{
            // get migration script file
            // (%installation%/defaults/migration/migration.js)
            var migrationScriptFile = Components.classes["@mozilla.org/file/directory_service;1"]
            .getService(Components.interfaces.nsIProperties)
            .get("DefRt", Components.interfaces.nsIFile); // %installation%/defaults/
            migrationScriptFile.append('migration'); // %installation%/defaults/migration/
            migrationScriptFile.append('migration.js'); // %installation%/defaults/migration/migration.js
            if(migrationScriptFile.exists()){
                // import migration.js in a clean object
                var migrationWrapper = {};
                Components.utils.import("resource://modules/formater.jsm");
                var migrationScriptURI = formater.getURI({
                    file: migrationScriptFile
                }).spec;
                Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                .getService(Components.interfaces.mozIJSSubScriptLoader)
                .loadSubScript(migrationScriptURI, migrationWrapper);
                // run migrate if function exists
                if(migrationWrapper.migrate){
                    var defaultMigrationMessage = "Your profile is required to migrate.\n"
                            + "Do you want to continue?\n"
                            + "(it may take some times, and the application can be restared)\n"
                            + "\n"
                            + "(The application will stop if you cancel)";
                    var migrationMessage = migrationWrapper.message || defaultMigrationMessage;
                    var continueMigration = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                            .getService(Components.interfaces.nsIPromptService)
                            .confirm(null, "Migration required", "");
                    if(continueMigration){
                        migrationWrapper.migrate(profileVersion, appVersion);
                    } else {
                        throw "migration from [" + profileVersion + "] to [" + appVersion + "] aborted by user";
                    };
                } else {
                    throw "migration file [" + migrationScriptFile.path + "] was found but it does not contains a migrate function";
                };
                // upgrade profile version
                Preferences.set('offline.application.profileVersion', appVersion);
            };
        } catch(e) {
            throw(e);
        };
    };
    return true;
}

/**
 * Init the network check Private method : you should never use it
 * 
 * @private
 */
function initNetworkCheck() {
    logIHM("initNetworkCheck");

    Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService)
    .addObserver(updateConnectStatus, "network:link-status-changed",
            false);
    /* First call is not trustable, so I initiate it don't suppress it please */
    networkChecker.isOffline();
}
/**
 * Init the application Private method : you should never use it
 * 
 * @private
 */
function initApplication() {

    logIHM("initApplication");

    var firstRun = Preferences.get("offline.application.firstRun", true);
    var fullyInitialised = Preferences.get(
            "offline.application.fullyInitialised", false);

    if (firstRun) {
        window.openDialog(
                "chrome://dcpoffline/content/wizards/initialization.xul", "",
                "chrome,titlebar,centerscreen,modal");
    } else {
        this.openLoginDialog();
        initValues();
    }
}
/**
 * init all the listener Private method : you should never use it Launch it
 * first : beware this method handle all the behaviour of the application if you
 * break it you break the IHM
 * 
 * @private
 */
function initListeners() {
    logIHM("initListeners");

    applicationEvent.subscribe("initializationWizardEnd", initValues);

    applicationEvent.subscribe("changeSelectedDomain", updateDomainPreference);
    applicationEvent.subscribe("postChangeSelectedDomain",
            updateOpenDocumentList);
    applicationEvent.subscribe("postChangeSelectedDomain", updateDocManager);
    applicationEvent.subscribe("changeSelectedDomain", updateFamilyList);
    applicationEvent.subscribe("changeSelectedDomain", updateAbstractList);
    applicationEvent.subscribe("postChangeSelectedDomain",
            tryToUpdateOpenFamily);
    applicationEvent.subscribe("postChangeSelectedDomain",
            tryToUpdateCurrentDocument);

    applicationEvent.subscribe("postChangeSelectedFamily", updateAbstractList);
    applicationEvent.subscribe("postChangeSelectedFamily",
            updateCurrentFamilyPreference);
    applicationEvent.subscribe("postChangeSelectedFamily",
            cleanCurrentDocSearch);

    applicationEvent.subscribe("preOpenDocument", prepareDoc);
    applicationEvent.subscribe("openDocument",
            updateCurrentOpenDocumentPreference);
    applicationEvent.subscribe("openDocument", addDocumentToOpenList);
    applicationEvent.subscribe("openDocument", setPrefCurrentOpenDocument);
    applicationEvent.subscribe("postOpenDocument", openDocument);

    applicationEvent.subscribe("preSynchronize", tryToCloseAllDocuments);
    applicationEvent.subscribe("postSynchronize", updateFamilyList);
    applicationEvent.subscribe("postSynchronize", updateAbstractList);

    applicationEvent.subscribe("postUpdateFamilyList",
            setPrefCurrentSelectedFamily);

    applicationEvent.subscribe("postUpdateListOfOpenDocumentsPreference",
            updateOpenDocumentList);

    applicationEvent.subscribe("askForCloseDocument", tryToCloseDocument);

    applicationEvent.subscribe("askForOpenDocument", tryToOpenDocument);

    applicationEvent.subscribe("askForCreateDocument", tryToCreateDocument);
    applicationEvent.subscribe("createDocument", createDocument);
    applicationEvent.subscribe("postCreateDocument", tryToOpenDocument);

    applicationEvent.subscribe("preCloseDocument", prepareCloseDocument);
    applicationEvent.subscribe("closeDocument", removeDocumentFromOpenList);
    applicationEvent.subscribe("postCloseDocument", closeDocument);

    applicationEvent.subscribe("askForCloseApplication", tryToClose);

    // applicationEvent.subscribe("preCloseAllDocuments", FIXME);
    applicationEvent.subscribe("closeAllDocuments", closeAllDocuments);
    // applicationEvent.subscribe("postCloseAllDocuments", FIXME);

    applicationEvent.subscribe("preClose", tryToCloseAllDocuments);
    applicationEvent.subscribe("close", close);

    /*
     * Document modifications
     */
    applicationEvent.subscribe("postStoreDocument", updateAbstractList);

    applicationEvent.subscribe("postRemoveDocument", updateAbstractList);
    applicationEvent.subscribe("postSaveDocument", updateAbstractList);

}
/**
 * Init the values of the IHM Private method : you should never use it
 * 
 * @private
 */
function initValues() {
    logIHM("initValues");
    setPrefCurrentSelectedDomain(true);
    setPrefCurrentSelectedFamily(true);
    setPrefCurrentOpenDocument(true);
    if (!networkChecker.isOffline()) {
        updateConnectStatus(null, null, "up");
    } else {
        updateConnectStatus(null, null, "down");
    }
    document.getElementById("userName").label = "";

    if (Preferences.get("offline.user.lastName", false)) {
        document.getElementById("userName").label += Preferences
        .get("offline.user.lastName");
    }
    if (Preferences.get("offline.user.firstName", false)) {
        document.getElementById("userName").label += " "
            + Preferences.get("offline.user.firstName");
    }
}

/* Dialog opener */

/**
 * Open the login dialog Private method : you should never use it
 * 
 * @private
 */
function openLoginDialog() {
    window.openDialog("chrome://dcpoffline/content/dialogs/authent.xul", "",
    "chrome,modal");
}
/**
 * Open the new document dialog Private method : you should never use it
 * 
 * @private
 */
function openNewDocumentDialog() {
    window.openDialog("chrome://dcpoffline/content/dialogs/newDocument.xul",
            "", "chrome,modal");
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
 * Open the synchro dialog Private method : you should never use it
 * 
 * @private
 */
function openSynchro() {
    window.openDialog("chrome://dcpoffline/content/dialogs/synchro.xul", "",
    "chrome,modal");
}
/**
 * Open the log dialog Private method : you should never use it
 * 
 * @private
 */
function openLog() {
    window.openDialog("chrome://dcpoffline/content/dialogs/log.xul", "",
    "chrome,modal");
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

// Public Methods
/**
 * Try to change the current selected domain
 * 
 * @param value
 */
function tryToChangeDomain(value) {
    logIHM("try to change Domain " + value);
    var param = {
            domainId : value
    };
    if (!applicationEvent.publish("preChangeSelectedDomain", param)) {
        // TODO add alert message
        alert("unable to change domain");
        setPrefCurrentSelectedDomain();
    } else {
        logConsole("change Domain " + value);
        applicationEvent.publish("changeSelectedDomain", param);
        applicationEvent.publish("postChangeSelectedDomain", param);
    }

}
/**
 * Try to change the current selected family
 * 
 * @param value
 */
function tryToChangeFamily(value) {
    logConsole("try to change selected family " + value);
    var param = {
            famId : value
    };
    if (!applicationEvent.publish("preChangeSelectedFamily", param)) {
        // TODO add alert message
        alert("unable to change selected family");
        setPrefCurrentSelectedFamily();
    } else {
        applicationEvent.publish("changeSelectedFamily", param);
        applicationEvent.publish("postChangeSelectedFamily", param);
    }
}
/**
 * Try to create a document
 * 
 * @param param
 * @returns {Boolean}
 */
function tryToCreateDocument(param) {
    logIHM("try to create document", param);
    if(param && param.famId){
        if (!applicationEvent.publish("preCreateDocument", param)) {
            // TODO add alert message
            alert("unable to create document");
        } else {
            param.fromid = param.famId;
            applicationEvent.publish("createDocument", param);
            param.mode='edit';
            applicationEvent.publish("postCreateDocument", param);
        }
    }
    return true;
}
function createDocument(param) {
    logIHM("create document", param);
    if(param && param.famId){
        param.documentId = docManager.createLocalDocument(param).getInitid();
    }
    return true;
}
/**
 * Try to change to open a document this method should also be used to change
 * the state of a document
 * 
 * @param param
 */
function tryToOpenDocument(param) {
    logIHM("try to change open document", param);
    var deck = null;
    if (!(param && param.documentId)) {
        deck = document.getElementById('documentsDeck');
        deck.selectedPanel = document.getElementById('vboxDocument-void');
        return false;
    }
    if (!applicationEvent.publish("preOpenDocument", param)) {
        // TODO add alert message
        alert("unable to change selected document");
        setPrefCurrentOpenDocument();
    } else {
        applicationEvent.publish("openDocument", param);
        applicationEvent.publish("postOpenDocument", param);
    }
    return true;
}
/**
 * Try to change to close a document
 * 
 * @param param
 */
function tryToCloseDocument(param) {
    logIHM("try to close document ", param);
    if (!(param && param.documentId)) {
        return false;
    }
    if (!applicationEvent.publish("preCloseDocument", param)) {
        // TODO add alert message
        alert("unable to close selected document");
        return false;
    } else {
        applicationEvent.publish("closeDocument", param);
        applicationEvent.publish("postCloseDocument", param);
        if (param.openAfterClose) {
            tryToOpenDocument({
                documentId : param.openAfterClose
            });
        }
    }
    return true;
}
/**
 * Try to change to close a document
 * 
 * @param param
 */
function tryToCloseAllDocuments(param) {
    logIHM("try to close all documents ", param);
    if (!applicationEvent.publish("preCloseAllDocuments", param)) {
        // TODO add alert message
        alert("unable to close all documents");
        return false;
    } else {
        if(applicationEvent.publish("closeAllDocuments", param)){
            return applicationEvent.publish("postCloseAllDocuments", param);
        } else {
            return false;
        }
    }
    return true;
}
/**
 * Try to close the application
 */
function tryToClose() {
    logIHM("try to close application ");
    if (applicationEvent.publish("preClose")) {
        return applicationEvent.publish("close");
    } else {
        // TODO add alert message
        alert("unable to close application");
        return false;
    }
}
/**
 * Update current open document
 */
function tryToUpdateCurrentDocument() {
    logIHM("updateCurrentDocument");
    setPrefCurrentOpenDocument(true);
}

/**
 * Update current open families
 */
function tryToUpdateOpenFamily() {
    logIHM("updateCurrentDocument");
    setPrefCurrentSelectedFamily(true);
}

// IHM methods

/**
 * Close the application Private method : you should never use it
 * 
 * @private
 */
function close() {
    Cc['@mozilla.org/toolkit/app-startup;1'].getService(Ci.nsIAppStartup).quit(
            Ci.nsIAppStartup.eAttemptQuit);
}
function updateConnectStatus(aSubject, aTopic, status) {
    logConsole("update connect status ", status);
    var translate = new StringBundle(
    "chrome://dcpoffline/locale/main.properties");
    if (status == "up") {
        document.getElementById("connectionStatus").label = translate
        .get("main.connectStatus.up");
    }
    if (status == "down") {
        document.getElementById("connectionStatus").label = translate
        .get("main.connectStatus.down");
    }
    if (status == "unknown") {
        document.getElementById("connectionStatus").label = translate
        .get("main.connectStatus.unknown");
    }
}
/**
 * openDocument in main IHM Private method : you should never use it
 * 
 * @private
 * 
 * @param config
 */
function openDocument(config) {

    logIHM("openDocument " + config.documentId);

    var doc;
    var template, mode;
    var deck;
    var documentRepresentationId, documentRepresentation;

    deck = document.getElementById('documentsDeck');

    if (config && config.documentId) {

        mode = config.mode || 'view';
        try {
            doc = docManager.getLocalDocument({
                initid : config.documentId
            });
            template = doc.getBinding(mode);
            if (template) {
                template = 'url("' + template + '")';
                documentRepresentationId = 'vboxDocument-' + config.documentId;
                documentRepresentation = document
                .getElementById(documentRepresentationId);
                if (!documentRepresentation) {
                    documentRepresentation = document.createElement('vbox');
                    documentRepresentation.setAttribute('flex', 1);
                    documentRepresentation.setAttribute('initid',
                            config.documentId);
                    documentRepresentation.setAttribute('fromid', doc
                            .getProperty('fromid'));
                    documentRepresentation.setAttribute('fromname', doc
                            .getProperty('fromname'));
                    documentRepresentation.id = documentRepresentationId;
                    documentRepresentation.style.MozBinding = template;
                    documentRepresentation = deck
                    .appendChild(documentRepresentation);
                }
                deck.selectedPanel = documentRepresentation;
            } else {
                throw new BindException(
                        "openDocument :: no template for initid: "
                        + config.documentId);
            }
        } catch (e) {
            alert(e.toString());
            throw (e);
        }
    } else {
        deck.selectedPanel = document.getElementById("vboxDocument-void");
    }

}
/**
 * Close a document Private method : you should never use it
 * 
 * @private
 * 
 * @param config
 */
function closeDocument(config) {

    logIHM("closeDocument " + config.documentId);

    var deck;
    var documentRepresentationId, documentRepresentation;

    if (config && config.documentId) {
        deck = document.getElementById('documentsDeck');
        documentRepresentationId = 'vboxDocument-' + config.documentId;
        documentRepresentation = document
        .getElementById(documentRepresentationId);
        if (documentRepresentation) {
            deck.removeChild(documentRepresentation);
            deck.selectedPanel = document.getElementById("vboxDocument-void");
        } else {
            logConsole("closeDocument :: document " + config.documentId
                    + " is not open");
        }
    }
}
/**
 * Close all documents (Private method : you should never use it)
 * 
 * @private
 * @param config
 */
function closeAllDocuments(config) {

    logIHM("closeAllDocuments ", config);

    var openDocuments = getListOfOpenDocuments();

    for(var documentId in openDocuments){
        if(! tryToCloseDocument({documentId: documentId}) ){
            return false;
        }
    }

    return true;
}

/**
 * update interface family list Private method : you should never use it
 * 
 * @private
 */
function updateFamilyList(config) {
    logIHM("updateFamilyList");
    if (config && config.domainId) {
        document.getElementById("famDomainIdParam").textContent = config.domainId;
    }
    document.getElementById("familyList").builder.rebuild();
    // applicationEvent.publish("postUpdateFamilyList");
}
/**
 * update abstract list Private method : you should never use it
 * 
 * @private
 * 
 * @param config
 */
function updateAbstractList(config) {
    logIHM("updateAbstractList", config);
    if (config && config.domainId != undefined) {
        document.getElementById("abstractDomainIdParam").textContent = config.domainId;
    }
    if (config && config.famId != undefined) {
        document.getElementById("famIdParam").textContent = config.famId;
    }
    if (config && config.searchValue != undefined) {
        document.getElementById("searchTitleParam").textContent = '%'
            + config.searchValue + '%';
    }
    document.getElementById("abstractList").builder.rebuild();
    document.getElementById("abstractList").selectedIndex = -1;
    // applicationEvent.publish("postUpdateAbstractList");
}
/**
 * Update documentList IHM Private method : you should never use it
 * 
 * @private
 * 
 * @param config
 */
function updateOpenDocumentList() {
    logIHM("updateOpenDocumentList");
    var documentList = document.getElementById("openDocumentList");

    var currentOpenDocument = getCurrentDocument();
    var currentDocs = getListOfOpenDocuments();
    var currentDocId;

    if (currentOpenDocument) {
        currentOpenDocument = currentOpenDocument.documentId;
    }

    documentList.removeAllItems();
    documentList.selectedIndex = -1;
    if (currentDocs) {
        for (currentDocId in currentDocs) {
            var currentListItem = documentList.appendItem(
                    currentDocs[currentDocId].title, currentDocId);
            if (currentDocId == currentOpenDocument) {
                documentList.selectedItem = currentListItem;
            }
        }
    }
}
/**
 * Update documentList pref Private method : you should never use it
 * 
 * @private
 * 
 * @param config
 */
function addDocumentToOpenList(config) {
    logIHM("addDocumentToOpenList");
    var currentDocs = {};
    if (config && config.documentId) {
        if (getListOfOpenDocuments()) {
            currentDocs = getListOfOpenDocuments();
        }
        var title = docManager.getLocalDocument({
            initid : config.documentId
        }).getTitle();
        currentDocs[config.documentId] = {
                title : title,
                mode : config.mode
        };
        Preferences.set("offline.user." + getCurrentDomain()
                + ".currentListOfOpenDocuments", JSON.stringify(currentDocs));
        applicationEvent.publish("postUpdateListOfOpenDocumentsPreference");
    }
}
/**
 * Remove a document from the open list Private method : you should never use it
 * 
 * @private
 * 
 * @param config
 */
function removeDocumentFromOpenList(config) {
    logIHM("removeDocumentFromOpenList");
    var currentDocs = {};
    if (config && config.documentId) {
        if (getListOfOpenDocuments()) {
            currentDocs = getListOfOpenDocuments();
        }
        delete currentDocs[config.documentId];
        Preferences.set("offline.user." + getCurrentDomain()
                + ".currentListOfOpenDocuments", JSON.stringify(currentDocs));
        applicationEvent.publish("postUpdateListOfOpenDocumentsPreference");
    }
}
/**
 * Update the selected domain pref Private method : you should never use it
 * 
 * @private
 * 
 * @param config
 */
function updateDomainPreference(config) {
    logIHM("updateDomainPreference");
    if (config && config.domainId) {
        Preferences.set("offline.user.currentSelectedDomain", config.domainId);
    }
}
/**
 * Update the doc manager Private method : you should never use it
 * 
 * @private
 * 
 * @param config
 */
function updateDocManager(config) {
    logIHM("updateDocManager");
    if (config && config.domainId) {
        docManager.setActiveDomain({
            domain : config.domainId
        });
    }
}
/**
 * Update the selected family pref Private method : you should never use it
 * 
 * @private
 * 
 * @param config
 */
function updateCurrentFamilyPreference(config) {
    logIHM("updateCurrentFamilyPreference");
    if (config && config.famId) {
        Preferences.set("offline.user." + getCurrentDomain()
                + ".currentSelectedFamily", config.famId);
    }
}
/**
 * Update the current open doc pref Private method : you should never use it
 * 
 * @private
 * 
 * @param config
 */
function updateCurrentOpenDocumentPreference(config) {
    logIHM("updateCurrentOpenDocumentPreference " + config.documentId);
    if (config && config.documentId) {
        Preferences.set("offline.user." + getCurrentDomain()
                + ".currentOpenDocument", JSON.stringify(config));
    }
}
/**
 * Clean the current abstract filter Private method : you should never use it
 * 
 * @private
 * 
 */
function cleanCurrentDocSearch() {
    logIHM("cleanCurrentDocSearch");
    document.getElementById("abstractSearchTitle").value = "";
    updateAbstractList({
        searchValue : ""
    });
}

/**
 * Update the IHM with the current selected domain Private method : you should
 * never use it
 * 
 * @private
 * 
 * @param propagEvent
 *            true if you want to propag the event
 */
function setPrefCurrentSelectedDomain(propagEvent) {
    logIHM("setPrefCurrentSelectedDomain");
    var domains = document.getElementById("domainList");
    document.getElementById("domainPopupList").builder.rebuild();
    if (!Preferences.get("offline.user.currentSelectedDomain", false) === false) {
        var nbDomains = domains.itemCount;
        for ( var i = 0; i < nbDomains; i++) {
            var currentDomain = domains.getItemAtIndex(i);
            if (Preferences.get("offline.user.currentSelectedDomain") == currentDomain.value) {
                domains.selectedIndex = i;
                if (propagEvent) {
                    tryToChangeDomain(currentDomain.value);
                }
                return;
            }
        }
    }
    domains.selectedIndex = -1;
    Preferences.reset("offline.user.currentSelectedDomain");
    if (propagEvent) {
        tryToChangeDomain(null);
    }
}
/**
 * Update the IHM with the current selected family of the domain Private method :
 * you should never use it
 * 
 * @private
 * 
 * @param propagEvent
 */
function setPrefCurrentSelectedFamily(propagEvent) {
    logIHM("setPrefCurrentSelectedFamily");
    var families = document.getElementById("familyList");
    if (!Preferences.get("offline.user." + getCurrentDomain()
            + ".currentSelectedFamily", false) === false) {
        var nbFamilies = families.itemCount;
        for ( var i = 0; i < nbFamilies; i++) {
            var currentFamily = families.getItemAtIndex(i);
            if (Preferences.get("offline.user." + getCurrentDomain()
                    + ".currentSelectedFamily") == currentFamily.value) {
                families.selectedIndex = i;
                if (propagEvent) {
                    tryToChangeFamily(currentFamily.value);
                }
                return;
            }
        }
    }
    families.selectedIndex = -1;
    Preferences.reset("offline.user." + getCurrentDomain()
            + ".currentSelectedFamily");
    if (propagEvent) {
        tryToChangeFamily(null);
    }
}
/**
 * Update the IHM with the current open document Private method : you should
 * never use it
 * 
 * @private
 * 
 * @param propagEvent
 */
function setPrefCurrentOpenDocument(propagEvent) {
    logIHM("setPrefCurrentOpenDocument ", getCurrentDocument());
    logIHM("setPrefCurrentOpenDocument propagEvent", propagEvent);
    var documents = document.getElementById("openDocumentList");
    var currentDocument = getCurrentDocument();
    var currentListElement, i;
    var nbDocuments;
    if (!currentDocument === false) {
        nbDocuments = documents.itemCount;
        for (i = 0; i < nbDocuments; i++) {
            currentListElement = documents.getItemAtIndex(i);
            if (currentDocument.documentId == currentListElement.value) {
                documents.selectedIndex = i;
                if (propagEvent === true) {
                    tryToOpenDocument(currentDocument);
                }
                return;
            }
        }
    }
    documents.selectedIndex = -1;
    Preferences.reset("offline.user." + getCurrentDomain()
            + ".currentOpenDocument");
    if (propagEvent === true) {
        tryToOpenDocument(null);
    }
}

function prepareCloseDocument(param) {
    logIHM("prepareCloseDocument", param);

    var currentDoc;
    var currentDocs;
    var stop = false;

    if (param && param.documentId) {
        currentDoc = getCurrentDocument();
        if (param.documentId == currentDoc.documentId) {
            currentDocs = getListOfOpenDocuments();
            for (var currentDocId in currentDocs) {
                if (stop) {
                    param.openAfterClose = currentDocId;
                    return true;
                }
                if (currentDocId == param.documentId) {
                    stop = true;
                }
            }
            if (!param.onAfterClose) {
                for (currentDocId in currentDocs) {
                    break;
                }
                if (currentDocId != currentDoc.documentId) {
                    param.openAfterClose = currentDocId;
                    return true;
                }
            }
        }
        return true;
    }
}

/**
 * Try to prepare the doc to be displayed Private method : you should never use
 * it Can cancel the display if the document is not ready to be display (in
 * edition...)
 * 
 * @private
 * 
 * @param param
 * @returns {Boolean}
 */
function prepareDoc(param) {
    logIHM("prepareDoc");
    var currentDocs = getListOfOpenDocuments();
    var currentDocId;
    var closeResult;

    for (currentDocId in currentDocs) {
        if (currentDocId == param.documentId) {
            if (!param.mode) {
                param.mode = currentDocs[currentDocId].mode;
            }
            if (currentDocs[currentDocId].mode != param.mode) {
                return tryToCloseDocument(param);
            }
        }
    }

    if (!param.mode) {
        param.mode = 'view';
    }

    return true;
}
// shortcut
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
 * Get the current open document
 * 
 * Private method : you should never use it
 * 
 * @private
 */
function getCurrentDocument() {
    var currentOpenDocument = {};
    try {
        currentOpenDocument = JSON.parse(Preferences.get("offline.user."
                + getCurrentDomain() + ".currentOpenDocument", "{}"));
    } catch (e) {
        logConsole("getCurrentDocument " + e + " " + e.message + " "
                + e.fileName + " " + e.lineNumber + " " + e);
    }
    if (currentOpenDocument && currentOpenDocument.documentId) {
        currentOpenDocument = currentOpenDocument;
    } else {
        currentOpenDocument = false;
    }
    return currentOpenDocument;
}
/**
 * Get the current list of open documents
 * 
 * Private method : you should never use it
 * 
 * @private
 */
function getListOfOpenDocuments() {
    var openList = {};
    try {
        openList = JSON.parse(Preferences.get("offline.user."
                + getCurrentDomain() + ".currentListOfOpenDocuments", "{}"));
    } catch (e) {
        logConsole("getListOfOpenDocuments " + e + " " + e.message + " "
                + e.fileName + " " + e.lineNumber + " " + e);
        throw e;
    }
    return openList;
}
/**
 * Shortcut to the logConsole
 * 
 */
function logIHM(message, object) {
    logConsole(message, object);
}

/* debug stuff */

/* required for venkman */
function toOpenWindowByType(inType, uri) {
    var winopts = "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar";
    window.open(uri, "_blank", winopts);
}

function debugDisplayDoc(initid) {
    document.getElementById("document").value = JSON.stringify(docManager
            .getLocalDocument({
                initid : initid
            }));
}
