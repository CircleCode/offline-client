const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/docManager.jsm");
Cu.import("resource://modules/network.jsm");
Cu.import("resource://modules/events.jsm");
Cu.import("resource://modules/preferences.jsm");
Cu.import("resource://modules/fdl-context.jsm");
Cu.import("resource://modules/offlineSynchronize.jsm");
Cu.import("resource://modules/StringBundle.jsm");
Cu.import("resource://gre/modules/Services.jsm");

/* enabling password manager */
Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);


/* Add window binding onLoad and onClose*/
window.onload = function() {
    initListeners();
    initApplication();
    initSession(true);
    initValues();
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
    var translate = new StringBundle("chrome://dcpoffline/locale/main.properties");
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
    applicationEvent.publish("close");
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

/*function openDocument(initid, mode) {
    mode = mode || 'view';
    
    var doc;
    var template;
    var box, tabPanel, tabBox, tab, tabId, tabPanelId;
    
    if (initid) {
        try {
            doc = docManager.getLocalDocument({
                initid : initid
            });
            template = doc.getBinding(mode);
            if (template) {
                template = 'url(file://' + template + ')';
                
                tabBox = document.getElementById('onefam-content-tabbox');
                tabId = 'tab-document-'+initid;
                tabPanelId = 'tabPanel-document-'+initid;
                tab = document.getElementById(tabId);
                tabPanel = document.getElementById('tabPanel-document-'+initid);
                if(! (tabPanel && tab) ){
                    //TODO: clean tabpanels and tabs
                    box = document.createElement('vbox');
                    box.setAttribute('flex', 1);
                    box.setAttribute('initid', initid);
                    box.style.MozBinding = template;
        
                    tabPanel = document.createElement('tabpanel');
                    tabPanel.setAttribute('flex', 1);
                    tabPanel.appendChild(box);
                    tabPanel.id = tabPanelId;
                    
                    tabBox.tabpanels.appendChild(tabPanel);
                    
                    tab = tabBox.tabs.appendItem(doc.getTitle());
                    tab.id = tabId;
                    tab.linkedpanel = tabPanelId;
                }
                
                tabBox.tabs.selectedItem = tab;
                tabBox.tabpanels.selectedPanel = tabPanel;
            } else {
                throw new BindException(
                        "openDocument :: no template for initid: " + initid);
            }
        } catch (e) {
            alert(e.toString());
            throw (e);
        }
    } else {
        throw new ArgException("openDocument :: missing initid argument");
    }
    return tabPanel;
}*/

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
    applicationEvent.publish("postUpdateAbstractList");
}

function updateOpenDocumentList() 
{
    logIHM("updateOpenDocumentList");
    var documentList = document.getElementById("openDocumentList");
    documentList.removeAllItems();
    documentList.selectedIndex = -1;
    if (Preferences.get("offline.user."+getCurrentDomain()+".currentListOfOpenDocuments", false)) {
        var currentDocs = JSON.parse(Preferences.get("offline.user."+getCurrentDomain()+".currentListOfOpenDocuments"));
        var currentDocId;
        
        for (currentDocId in currentDocs) {
            var currentListItem = documentList.appendItem(currentDocs[currentDocId], currentDocId);
            if (currentDocId == Preferences.get("offline.user."+getCurrentDomain()+".currentOpenDocument")) {
                logIHM(currentDocId);
                documentList.selectedItem = currentListItem;
            }
        }
    }
}

function viewDocument(config) 
{
    logIHM("viewDocument");
    openDocument(config.documentId);
    debugDisplayDoc(config.documentId);
}

function addDocumentToOpenList(config) 
{
    logIHM("addDocumentToOpenList");
    var currentDocs = {};
    if (config && config.documentId) {
        if (Preferences.get("offline.user."+getCurrentDomain()+".currentListOfOpenDocuments", false)) {
            currentDocs = JSON.parse(Preferences.get("offline.user."+getCurrentDomain()+".currentListOfOpenDocuments"));
        }
        var title = docManager.getLocalDocument({initid : config.documentId}).getTitle();
        currentDocs[config.documentId] = title;
        Preferences.set("offline.user."+getCurrentDomain()+".currentListOfOpenDocuments",JSON.stringify(currentDocs));
        applicationEvent.publish("postUpdateOpenDocumentsPreference");
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
    logIHM("updateCurrentOpenDocumentPreference");
    if (config && config.documentId) {
        Preferences.set("offline.user."+getCurrentDomain()+".currentOpenDocument", config.documentId);
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
    logIHM(Preferences.get("offline.user."+getCurrentDomain()+".currentSelectedFamily", false));
    var families = document.getElementById("familyList");
    if (!Preferences.get("offline.user."+getCurrentDomain()+".currentSelectedFamily", false) === false) {
        var nbFamilies = families.itemCount;
        for(var i = 0; i < nbFamilies; i++) {
            var currentFamily = families.getItemAtIndex(i);
            if (Preferences.get("offline.user."+getCurrentDomain()+".currentSelectedFamily") == currentFamily.value) {
                logIHM(i);
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
    logIHM("setPrefCurrentOpenDocument "+Preferences.get("offline.user."+getCurrentDomain()+".currentOpenDocument"));
    var documents = document.getElementById("openDocumentList");
    if (!Preferences.get("offline.user."+getCurrentDomain()+".currentOpenDocument", false) === false) {
        var nbDocuments = documents.itemCount;
        for(var i = 0; i < nbDocuments; i++) {
            var currentDocument = documents.getItemAtIndex(i);
            if (Preferences.get("offline.user."+getCurrentDomain()+".currentOpenDocument") == currentDocument.value) {
                documents.selectedIndex = i;
                if (propagEvent) {
                    openDocument(currentDocument.value);
                }
                return;
            }
        }
    }
    documents.selectedIndex = -1;
    Preferences.reset("offline.user."+getCurrentDomain()+".currentOpenDocument");
    if (propagEvent) {
        openDocument(null);
    }
}

function initListeners()
{
    logIHM("initListeners");
    
    applicationEvent.subscribe("changeSelectedDomain", updateDomainPreference);
    applicationEvent.subscribe("postChangeSelectedDomain", updateFamilyList);
    applicationEvent.subscribe("postChangeSelectedDomain", updateAbstractList);
    applicationEvent.subscribe("postChangeSelectedDomain", updateOpenDocumentList);
    
    applicationEvent.subscribe("postChangeSelectedFamily", updateAbstractList);
    applicationEvent.subscribe("postChangeSelectedFamily", updateCurrentFamilyPreference);
    
    applicationEvent.subscribe("changeOpenDocument", updateCurrentOpenDocumentPreference);
    applicationEvent.subscribe("changeOpenDocument", addDocumentToOpenList);
    
    applicationEvent.subscribe("postSynchronize", updateFamilyList);
    applicationEvent.subscribe("postSynchronize", updateAbstractList);
    
    applicationEvent.subscribe("postUpdateFamilyList", setPrefCurrentSelectedFamily, true);
    
    applicationEvent.subscribe("postUpdateOpenDocumentsPreference", updateOpenDocumentList);
    
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
    logConsole("try to change Domain "+value);
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

function openDocument(value) {
    logConsole("try to change open document "+value);
    var param = {
            documentId : value
    };
    if (!applicationEvent.publish("preChangeOpenDocument", param)) {
        //TODO add alert message
        alert("unable to change selected document");
        setPrefCurrentOpenDocument();
    }else {
        applicationEvent.publish("changeOpenDocument", param);
        applicationEvent.publish("postChangeOpenDocument", param);
    }
}

//shortcut

function getCurrentDomain() {
    return Preferences.get("offline.user.currentSelectedDomain", "");
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
