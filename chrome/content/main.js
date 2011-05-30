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

/* enabling password manager */
Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);


/* Add window binding onLoad and onClose*/
window.onload = function() {
    initNetworkCheck();
    initListeners();
    initApplication();
    initSession();
    initValues();
}

function initNetworkCheck() {
    networkChecker.isOffline();
    setTimeout(initNetworkCheck, 15);
}

/* Dialog opener */
function openLoginDialog() {
    window.openDialog("chrome://dcpoffline/content/dialogs/authent.xul", "",
    "chrome,modal");
}

function openNewDocumentDialog() {
    window.openDialog("chrome://dcpoffline/content/dialogs/newDocument.xul", "",
    "chrome,modal");
}

function openCloseDialog() {
    /*window.openDialog("chrome://dcpoffline/content/dialogs/close.xul", "",
    "chrome,modal");*/
    launchClose();
}

function openPreferences() {
    window.openDialog("chrome://dcpoffline/content/dialogs/preferences.xul", "",
    "chrome,modal");
}

function openSynchro() {
    window.open("chrome://dcpoffline/content/dialogs/synchro.xul", "",
    "chrome,modal");
}

function openLog() {
    window.openDialog("chrome://dcpoffline/content/dialogs/log.xul", "",
    "chrome,modal");
}

function openAbout() {
    window.openDialog("chrome://dcpoffline/content/dialogs/about.xul", "",
    "chrome,modal");
}

/* init elements */

function initApplication() 
{
    var firstRun = Preferences.get("offline.application.firstRun", false);
    var fullyInitialised = Preferences.get("offline.application.fullyInitialised", false);
}

function initSession(firstLaunch) 
{
    /*var translate = new StringBundle("chrome://dcpoffline/locale/main.properties");
    var login = Preferences.get("offline.user.login", false);
    var password = Preferences.get("offline.user.password", false);
    var applicationURL = Preferences.get("offline.user.applicationURL", false);
    if (!networkChecker.isOffline()) {
        if (!(login && password && applicationURL)) {
            openLoginDialog();
        }else {
            context.url = applicationURL;
            if (context.isConnected()) {
                var authent = context.setAuthentification({
                    login : login,
                    password : password
                });
                if (authent) {
                    offlineSync.recordOfflineDomains();
                    return;
                }else {
                    Services.prompt.alert(window,"main.initSession.unableToLog.title", translate.get("main.initSession.unableToLog"));
                    openLoginDialog();
                    initSession();
                    return;
                }
            }else {
                if (firstLaunch) {
                    logConsole("firstLaunch ?? relaunch");
                    setTimeout(initSession, 15);
                    return;
                }
                Services.prompt.alert(window,"main.initSession.serverOffline.title", translate.get("main.initSession.serverOffline"));
                openLoginDialog();
                initSession();
                return;
            }
        }

    }else {
        if (!(login && password && applicationURL)) {
            Services.prompt.alert(window,translate.get("main.initSession.offline.userPreferencesUnset.title"), translate.get("main.initSession.offline.userPreferencesUnset"));
        }else{
            return;
        }
    }
    applicationEvent.publish("close");*/
    this.openLoginDialog();
}

/* interface element */

function launchClose()
{
    if (applicationEvent.publish("preClose")) {
        applicationEvent.publish("close");
    }else{
        //TODO add alert message
        alert("unable to close application");
    }
}

function close()
{
    Cc['@mozilla.org/toolkit/app-startup;1'].getService(Ci.nsIAppStartup).quit(Ci.nsIAppStartup.eAttemptQuit);
}

function reload()
{
    Cc['@mozilla.org/toolkit/app-startup;1'].getService(Ci.nsIAppStartup).quit(Ci.nsIAppStartup.eAttemptQuit|Ci.nsIAppStartup.eRestart);
}

function openDocument(config) {

    logIHM("openDocument "+config.documentId);

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
                template = 'url(file://' + template + ')';
                documentRepresentationId = 'vboxDocument-'+config.documentId;
                documentRepresentation= document.getElementById(documentRepresentationId);
                if(! documentRepresentation ){
                    documentRepresentation = document.createElement('vbox');
                    documentRepresentation.setAttribute('flex', 1);
                    documentRepresentation.setAttribute('initid', config.documentId);
                    documentRepresentation.id = documentRepresentationId;
                    documentRepresentation.style.MozBinding = template;
                    documentRepresentation = deck.appendChild(documentRepresentation);
                }
                deck.selectedPanel = documentRepresentation;
            } else {
                throw new BindException(
                        "openDocument :: no template for initid: " + config.documentId);
            }
        } catch (e) {
            alert(e.toString());
            throw (e);
        }
    }else {
        deck.selectedPanel = document.getElementById("vboxDocument-void");
    }

}

function closeDocument(config) {

    logIHM("closeDocument "+config.documentId);

    var deck;
    var documentRepresentationId, documentRepresentation;

    if (config && config.documentId) {
        deck = document.getElementById('documentsDeck');
        documentRepresentationId = 'vboxDocument-'+config.documentId;
        documentRepresentation= document.getElementById(documentRepresentationId);
        if(documentRepresentation ){
            deck.removeChild(documentRepresentation);
        } else {
            logConsole(
                    "closeDocument :: document "+config.documentId+" is not open");
        }
    }
}


/* Listeners */
function updateFamilyList(config)
{
    logIHM("updateFamilyList");
    if (config && config.domainId) {
        document.getElementById("famDomainIdParam").textContent = config.domainId;
    }
    document.getElementById("familyList").builder.rebuild();
    applicationEvent.publish("postUpdateFamilyList");
}

function updateAbstractList(config)
{
    logIHM("updateAbstractList");
    if (config && config.domainId != undefined) {
        document.getElementById("abstractDomainIdParam").textContent = config.domainId;
    }
    if (config && config.famId != undefined) {
        document.getElementById("famIdParam").textContent = config.famId;
    }
    if (config && config.searchValue != undefined) {
        document.getElementById("searchTitleParam").textContent = '%'+config.searchValue+'%';
    }
    document.getElementById("abstractList").builder.rebuild();
    document.getElementById("abstractList").selectedIndex =  -1;
    applicationEvent.publish("postUpdateAbstractList");
}

function updateOpenDocumentList() 
{
    logIHM("updateOpenDocumentList");
    var documentList = document.getElementById("openDocumentList");

    var currentOpenDocument = getCurrentDocument();
    var currentDocs = getListOfOpenDocuments();
    var currentDocId;

    if (currentOpenDocument) {
        currentOpenDocument =  currentOpenDocument.documentId;
    }

    documentList.removeAllItems();
    documentList.selectedIndex = -1;
    if (currentDocs) {

        for (currentDocId in currentDocs) {
            var currentListItem = documentList.appendItem(currentDocs[currentDocId].title, currentDocId);
            if (currentDocId == currentOpenDocument) {
                documentList.selectedItem = currentListItem;
            }
        }
    }
}

function addDocumentToOpenList(config) 
{
    logIHM("addDocumentToOpenList");
    var currentDocs = {};
    if (config && config.documentId) {
        if (getListOfOpenDocuments()) {
            currentDocs = getListOfOpenDocuments();
        }
        var title = docManager.getLocalDocument({initid : config.documentId}).getTitle();
        currentDocs[config.documentId] = { title : title, mode : config.mode};
        Preferences.set("offline.user."+getCurrentDomain()+".currentListOfOpenDocuments",JSON.stringify(currentDocs));
        applicationEvent.publish("postUpdateListOfOpenDocumentsPreference");
    }
}

function removeDocumentFromOpenList(config) 
{
    logIHM("removeDocumentFromOpenList");
    var currentDocs = {};
    if (config && config.documentId) {
        if (getListOfOpenDocuments()) {
            currentDocs = getListOfOpenDocuments();
        }
        delete currentDocs[config.documentId];
        Preferences.set("offline.user."+getCurrentDomain()+".currentListOfOpenDocuments",JSON.stringify(currentDocs));
        applicationEvent.publish("postUpdateListOfOpenDocumentsPreference");
    }
}

function updateDomainPreference(config)
{
    logIHM("updateDomainPreference");
    if (config && config.domainId) {
        Preferences.set("offline.user.currentSelectedDomain", config.domainId);
    }
}

function updateDocManager(config) {
    logIHM("updateDocManager");
    if (config && config.domainId) {
        docManager.setActiveDomain({
            domain : config.domainId
        });
    }
}

function updateCurrentFamilyPreference(config)
{
    logIHM("updateCurrentFamilyPreference");
    if (config && config.famId) {
        Preferences.set("offline.user."+getCurrentDomain()+".currentSelectedFamily", config.famId);
    }
}

function updateCurrentOpenDocumentPreference(config)
{
    logIHM("updateCurrentOpenDocumentPreference "+config.documentId);
    if (config && config.documentId) {
        Preferences.set("offline.user."+getCurrentDomain()+".currentOpenDocument", JSON.stringify(config));
    }
}

function setPrefCurrentSelectedDomain(propagEvent)
{
    logIHM("setPrefCurrentSelectedDomain");
    var domains = document.getElementById("domainList");
    if (!Preferences.get("offline.user.currentSelectedDomain", false) === false) {
        var nbDomains = domains.itemCount;
        for(var i = 0; i < nbDomains; i++) {
            var currentDomain = domains.getItemAtIndex(i);
            if (Preferences.get("offline.user.currentSelectedDomain") == currentDomain.value) {
                domains.selectedIndex = i;
                if (propagEvent) {
                    changeDomain(currentDomain.value);
                }
                return;
            }
        }
    }
    domains.selectedIndex = -1;
    Preferences.reset("offline.user.currentSelectedDomain");
    if (propagEvent) {
        changeDomain(null);
    }
}

function setPrefCurrentSelectedFamily(propagEvent)
{
    logIHM("setPrefCurrentSelectedFamily");
    var families = document.getElementById("familyList");
    if (!Preferences.get("offline.user."+getCurrentDomain()+".currentSelectedFamily", false) === false) {
        var nbFamilies = families.itemCount;
        for(var i = 0; i < nbFamilies; i++) {
            var currentFamily = families.getItemAtIndex(i);
            if (Preferences.get("offline.user."+getCurrentDomain()+".currentSelectedFamily") == currentFamily.value) {
                families.selectedIndex = i;
                if (propagEvent) {
                    changeFamily(currentFamily.value);
                }
                return;
            }
        }
    }
    families.selectedIndex = -1;
    Preferences.reset("offline.user."+getCurrentDomain()+".currentSelectedFamily");
    if (propagEvent) {
        changeFamily(null);
    }
}

function setPrefCurrentOpenDocument(propagEvent)
{
    logIHM("setPrefCurrentOpenDocument "+getCurrentDocument());
    var documents = document.getElementById("openDocumentList");
    var currentDocument = getCurrentDocument();
    var currentListElement, i;
    var nbDocuments;
    if (!currentDocument === false) {
        nbDocuments = documents.itemCount;
        for(i = 0; i < nbDocuments; i++) {
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
    Preferences.reset("offline.user."+getCurrentDomain()+".currentOpenDocument");
    if (propagEvent === true) {
        tryToOpenDocument(null);
    }
}

function prepareDoc(param) {
    logIHM("prepareDoc");
    var currentDocs = getListOfOpenDocuments();
    var currentDocId;
    var closeResult;
    

    
    for (currentDocId in currentDocs) {
        if (currentDocId == param.documentId) {
            if (!param.mode){
                param.mode = currentDocs[currentDocId].mode;
            }
            if (currentDocs[currentDocId].mode != param.mode){
                return tryToCloseDocument(param);
            }
        }
    }
    
    if (!param.mode){
        param.mode = 'view';
    }
    
    return true;
}

function initListeners()
{
    logIHM("initListeners");

    applicationEvent.subscribe("changeSelectedDomain", updateDomainPreference);
    applicationEvent.subscribe("postChangeSelectedDomain", updateFamilyList, true);
    applicationEvent.subscribe("postChangeSelectedDomain", updateAbstractList);
    applicationEvent.subscribe("postChangeSelectedDomain", updateOpenDocumentList);
    applicationEvent.subscribe("postChangeSelectedDomain", updateDocManager);

    applicationEvent.subscribe("postChangeSelectedFamily", updateAbstractList);
    applicationEvent.subscribe("postChangeSelectedFamily", updateCurrentFamilyPreference);

    applicationEvent.subscribe("preOpenDocument", prepareDoc);
    applicationEvent.subscribe("openDocument", updateCurrentOpenDocumentPreference);
    applicationEvent.subscribe("openDocument", addDocumentToOpenList);
    applicationEvent.subscribe("openDocument", setPrefCurrentOpenDocument);
    applicationEvent.subscribe("postOpenDocument", openDocument);

    applicationEvent.subscribe("postSynchronize", updateFamilyList);
    applicationEvent.subscribe("postSynchronize", updateAbstractList);

    applicationEvent.subscribe("postUpdateFamilyList", setPrefCurrentSelectedFamily, true);


    //applicationEvent.subscribe("postUpdateAbstractList", setPrefCurrentSelectedFamily, true);

    applicationEvent.subscribe("postUpdateListOfOpenDocumentsPreference", updateOpenDocumentList);

    applicationEvent.subscribe("askForCloseDocument", tryToCloseDocument);
    
    applicationEvent.subscribe("askForOpenDocument", tryToOpenDocument);

    applicationEvent.subscribe("closeDocument",removeDocumentFromOpenList);
    applicationEvent.subscribe("postCloseDocument", closeDocument);

    applicationEvent.subscribe("close", close);
}

function initValues()
{
    logIHM("initValues");
    document.getElementById("domainPopupList").builder.rebuild();
    setPrefCurrentSelectedDomain(true);
    setPrefCurrentSelectedFamily(true);
    setPrefCurrentOpenDocument(true);
}

function changeDomain(value) {
    logIHM("try to change Domain "+value);
    var param = {
            domainId : value
    };
    if (!applicationEvent.publish("preChangeSelectedDomain", param)) {
        //TODO add alert message
        alert("unable to change domain");
        setPrefCurrentSelectedDomain();
    }else {
        logConsole("change Domain "+value);
        applicationEvent.publish("changeSelectedDomain", param);
        applicationEvent.publish("postChangeSelectedDomain", param);
    }

}

function changeFamily(value) {
    logConsole("try to change selected family "+value);
    var param = {
            famId : value
    };
    if (!applicationEvent.publish("preChangeSelectedFamily", param)) {
        //TODO add alert message
        alert("unable to change selected family");
        setPrefCurrentSelectedFamily();
    }else {
        applicationEvent.publish("changeSelectedFamily", param);
        applicationEvent.publish("postChangeSelectedFamily", param);
    }
}

function tryToOpenDocument(param) {
    logIHM("try to change open document");
    if (!(param && param.documentId)) {
        return false;
    }
    if (!applicationEvent.publish("preOpenDocument", param)) {
        //TODO add alert message
        alert("unable to change selected document");
        setPrefCurrentOpenDocument();
    }else {
        applicationEvent.publish("openDocument", param);
        applicationEvent.publish("postOpenDocument", param);
    }
    return true;
}

function tryToCloseDocument(param) {
    logConsole("try to close document "+param.documentId);
    if (!(param && param.documentId)) {
        return false;
    }
    if (!applicationEvent.publish("preCloseDocument", param)) {
        //TODO add alert message
        alert("unable to close selected document");
        return false;
    }else {
        applicationEvent.publish("closeDocument", param);
        applicationEvent.publish("postCloseDocument", param);
    }
    return true;
}

//shortcut

function getCurrentDomain() {
    return Preferences.get("offline.user.currentSelectedDomain", "");
}

function getCurrentDocument() {
    var currentOpenDocument = {};
    try {    
        currentOpenDocument = JSON.parse(Preferences.get("offline.user."+getCurrentDomain()+".currentOpenDocument", "{}"));
    } catch (e) {
        logConsole("getCurrentDocument "+e+" "+e.message+" "+e.fileName+" "+e.lineNumber+" "+e);
    }
    if (currentOpenDocument && currentOpenDocument.documentId) {
        currentOpenDocument = currentOpenDocument;
    }else {
        currentOpenDocument = false;
    }
    return currentOpenDocument;
}

function getListOfOpenDocuments() {
    var openList = {};
    try {    
        openList = JSON.parse(Preferences.get("offline.user."+getCurrentDomain()+".currentListOfOpenDocuments", "{}"));
    } catch (e) {
        logConsole("getCurrentDocument "+e+" "+e.message+" "+e.fileName+" "+e.lineNumber+" "+e);
    }
    return openList;
}

function logIHM(message) {
    logConsole(message);
}

/* debug stuff */

/* required for venkman */
function toOpenWindowByType(inType, uri) {
    var winopts = "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar";
    window.open(uri, "_blank", winopts);
}

function debugDisplayDoc(initid)
{
    document.getElementById("document").value = JSON.stringify(docManager.getLocalDocument({initid : initid}));
}
