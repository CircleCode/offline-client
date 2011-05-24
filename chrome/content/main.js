const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/storageManager.jsm");
Cu.import("resource://modules/docManager.jsm");
Cu.import("resource://modules/events.jsm");
Cu.import("resource://modules/preferences.jsm");

/* enabling password manager */
Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);


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
    applicationEvent.publish("close");
}

function openPreferences() {
    window.openDialog("chrome://dcpoffline/content/dialogs/preferences.xul", "",
    "chrome,modal");
}

function openSynchro() {
    window.openDialog("chrome://dcpoffline/content/dialogs/synchro.xul", "",
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

function openDocument(initid, mode) {
    if (initid) {
        try {
            var doc = docManager.getLocalDocument({
                initid : initid
            });
            var templates = storageManager.execQuery({
                query : "select * from templates where initid = :initid",
                params : {
                    initid : initid
                }
            });
            var template = (mode === 'edit')
            ? templates.edittemplate
                    : templates.viewtemplate;
            if (!template) {
                logConsole("using [url(chrome://dcpoffline/content/templates/document-animal.xml#document-animal)] as default template");
                template = "url(chrome://dcpoffline/content/templates/document-animal.xml#document-animal)";
            }
            if (template) {
                var box = document.createElement('vbox');
                box.setAttribute('flex', 1);
                box.setAttribute('initid', initid);
                box.style.MozBinding = template;

                var tabPanel = document.createElement('tabpanel');
                tabPanel.setAttribute('flex', 1);
                tabPanel.appendChild(box);

                var tabBox = document.getElementById('onefam-content-tabbox');

                tabPanel = tabBox.tabpanels.appendChild(tabPanel);
                tabBox.tabs.appendItem(doc.getTitle());
                /*
                logConsole(tabBox.tabs.getIndexOfItem(tabPanel));

                tabBox.tabs.selectedIndex = tabBox.tabs.getIndexOfItem(tabPanel);
                 */
            } else {
                throw new BindException(
                        "openDocument :: no template for initid: " + initid);
            }
        } catch (e) {
            alert(e.toString);
            throw (e);
        }
    } else {
        throw new ArgException("openDocument :: missing initid argument");
    }
    return tabPanel;
}

/* interface element */
function selectFamily(famId)
{
    document.getElementById("famIdParam").textContent = famId;
    document.getElementById("abstractList").builder.rebuild();
}

function updateAbstract()
{
    document.getElementById("searchTitleParam").textContent = '%'+document.getElementById('searchTitle').value+'%';
    document.getElementById("currentCriteria").value = document.getElementById('searchTitle').value;
    document.getElementById("abstractList").builder.rebuild();
}

function displayDoc(initid)
{
    document.getElementById("document").value = JSON.stringify(docManager.getLocalDocument({initid : initid}));
    openDocument(initid);
}

/* Listeners */
function updateFamilyList(domainId)
{
    logConsole("update family list");
    document.getElementById("famDomainIdParam").textContent = domainId;
    document.getElementById("familyList").builder.rebuild();
}

function updateAbstractList(domainId)
{
    logConsole("update abstract list");
    document.getElementById("abstractDomainIdParam").textContent = domainId;
    document.getElementById("abstractList").builder.rebuild();
}

function updateDomainPreference(domainId)
{
    Preferences.set("offline.user.currentDomain", domainId);
}

function close()
{
    logConsole("Cia les amigos");
    Cc['@mozilla.org/toolkit/app-startup;1'].getService(Ci.nsIAppStartup).quit(Ci.nsIAppStartup.eAttemptQuit);
}

function initPrefDomain()
{
    var domains = document.getElementById("domainList");
    var nbDomains = domains.itemCount;
    for(var i = 0; i < nbDomains; i++) {
        var currentDomain = domains.getItemAtIndex(i);
        if (Preferences.get("offline.user.currentDomain") == currentDomain.value) {
            domains.selectedIndex = i;
            changeDomain(currentDomain.value);
            break;
        }
    }
}

function initListeners()
{
    logConsole("Init listener");
    applicationEvent.subscribe("changeDomain", updateFamilyList);
    applicationEvent.subscribe("changeDomain", updateAbstractList);
    applicationEvent.subscribe("changeDomain", updateDomainPreference);
    applicationEvent.subscribe("close", close);
}

function initValues()
{
    logConsole("Init values");
    initPrefDomain();
    
}

function changeDomain(value) {
    logConsole("setDomain "+value);
    if (!applicationEvent.publish("preChangeDomain", value)) {
        alert("oupps i did it again");
    }else {
        applicationEvent.publish("changeDomain", value);
        applicationEvent.publish("postChangeDomain", value);
    }

}

/* debug stuff */

/* required for venkman */
function toOpenWindowByType(inType, uri) {
    var winopts = "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar";
    window.open(uri, "_blank", winopts);
}
