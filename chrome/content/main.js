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

function openDocument(initid, mode) {
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
            } else {
                //FIXME throw an exception
                logConsole("using [file:///media/Data/Workspaces/xul/offline-client/chrome/content/bindings/families/document-ZOO_ANIMAL-Binding.xml#document-ZOO_ANIMAL-view)] as default template");
                template = "url(file:///media/Data/Workspaces/xul/offline-client/chrome/content/bindings/families/document-ZOO_ANIMAL-Binding.xml#document-ZOO_ANIMAL-view)";
            }
            if (template) {
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
                    logConsole("binding box to " + template);
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
}

/* Listeners */
function updateFamilyList(config)
{
    logConsole("update family list");
    if (config && config.domainId) {
        document.getElementById("famDomainIdParam").textContent = config.domainId;
    }
    document.getElementById("familyList").builder.rebuild();
}

function updateAbstractList(config)
{
    logConsole("update abstract list");
    if (config && config.domainId != undefined) {
        document.getElementById("abstractDomainIdParam").textContent = config.domainId;
    }
    if (config && config.famId != undefined) {
        document.getElementById("famIdParam").textContent = config.famId;
    }
    if (config && config.searchValue != undefined) {
        document.getElementById("searchTitleParam").textContent = '%'+config.searchValue+'%';
        document.getElementById("currentCriteria").value = config.searchValue;
    }
    document.getElementById("abstractList").builder.rebuild();
}

function viewDocument(config) 
{
    logConsole("add a document representation");
    openDocument(config.documentId);
    debugDisplayDoc(config.documentId);
}

function updateDomainPreference(config)
{
    if (config && config.domainId) {
        Preferences.set("offline.user.currentSelectedDomain", config.domainId);
    }
}

function updateDocManager(config) {
    logConsole("update doc manager");
    if (config && config.domainId) {
        docManager.setActiveDomain({
            domain : config.domainId
        });
    }
}

function updateCurrentFamilyPreference(config)
{
    if (config && config.famId) {
        Preferences.set("offline.user.currentSelectedFamily", config.famId);
    }
}

function updateCurrentDocumentPreference(config)
{
    if (config && config.documentId) {
        Preferences.set("offline.user.currentSelectedDocument", config.documentId);
    }
}

function setPrefCurrentSelectedDomain(propagEvent)
{
    if (!Preferences.get("offline.user.currentSelectedDomain", false) === false) {
        var domains = document.getElementById("domainList");
        var nbDomains = domains.itemCount;
        for(var i = 0; i < nbDomains; i++) {
            var currentDomain = domains.getItemAtIndex(i);
            if (Preferences.get("offline.user.currentSelectedDomain") == currentDomain.value) {
                domains.selectedIndex = i;
                if (propagEvent) {
                    changeDomain(currentDomain.value);
                }
                break;
            }
        }
    }
}

function setPrefCurrentSelectedFamily(propagEvent)
{
    if (!Preferences.get("offline.user.currentSelectedFamily", false) === false) {
        var families = document.getElementById("familyList");
        var nbFamilies = families.itemCount;
        for(var i = 0; i < nbFamilies; i++) {
            var currentFamily = families.getItemAtIndex(i);
            if (Preferences.get("offline.user.currentSelectedFamily") == currentFamily.value) {
                families.selectedIndex = i;
                if (propagEvent) {
                    changeFamily(currentFamily.value);
                }
                break;
            }
        }
    }
}

function setPrefCurrentSelectedDocument(propagEvent)
{
    if (!Preferences.get("offline.user.currentSelectedDocument", false) === false) {
        var documents = document.getElementById("abstractList");
        var nbDocuments = documents.itemCount;
        for(var i = 0; i < nbDocuments; i++) {
            var currentDocument = documents.getItemAtIndex(i);
            if (Preferences.get("offline.user.currentSelectedDocument") == currentDocument.value) {
                documents.selectedIndex = i;
                if (propagEvent) {
                    changeDocument(currentDocument.value);
                }
                break;
            }
        }
    }
}

function initListeners()
{
    logConsole("Init listener");
    applicationEvent.subscribe("changeSelectedDomain", updateFamilyList);
    applicationEvent.subscribe("changeSelectedDomain", updateAbstractList);
    applicationEvent.subscribe("changeSelectedDomain", updateDomainPreference);
    applicationEvent.subscribe("changeSelectedDomain", updateDocManager);
    applicationEvent.subscribe("changeSelectedFamily", updateAbstractList);
    applicationEvent.subscribe("changeSelectedFamily", updateCurrentFamilyPreference);
    applicationEvent.subscribe("changeSelectedDocument", viewDocument);
    applicationEvent.subscribe("changeSelectedDocument", updateCurrentDocumentPreference);
    applicationEvent.subscribe("postSynchronize", updateFamilyList);
    applicationEvent.subscribe("postSynchronize", updateAbstractList);
    applicationEvent.subscribe("close", close);
}

function initValues()
{
    logConsole("Init values");
    document.getElementById("domainPopupList").builder.rebuild();
    setPrefCurrentSelectedDomain(true);
    setPrefCurrentSelectedFamily(true);
    setPrefCurrentSelectedDocument(true);
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

function changeDocument(value) {
    logConsole("try to change selected document "+value);
    var param = {
            documentId : value
    };
    if (!applicationEvent.publish("preChangeSelectedDocument", param)) {
        //TODO add alert message
        alert("unable to change selected document");
        setPrefCurrentSelectedDocument();
    }else {
        applicationEvent.publish("changeSelectedDocument", param);
        applicationEvent.publish("postChangeSelectedDocument", param);
    }
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
