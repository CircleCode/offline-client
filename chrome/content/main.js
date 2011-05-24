const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/docManager.jsm");
Cu.import("resource://modules/events.jsm");

/* enabling password manager */
Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);


/* Dialog opener */

function openLoginDialog() {
    /*window.openDialog("chrome://dcpoffline/content/dialogs/authent.xul", "",
            "chrome,modal");*/
}

function openNewDocumentDialog() {
    window.openDialog("chrome://dcpoffline/content/dialogs/newDocument.xul", "",
            "chrome,modal");
}

function openCloseDialog() {
    window.openDialog("chrome://dcpoffline/content/dialogs/close.xul", "",
            "chrome,modal");
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
}

/* Listeners */
function updateFamilyList(domainId)
{
    document.getElementById("famDomainIdParam").textContent = domainId;
    document.getElementById("familyList").builder.rebuild();
}

function updateAbstractList(domainId)
{
    document.getElementById("abstractDomainIdParam").textContent = domainId;
    document.getElementById("abstractList").builder.rebuild();
}

function initListeners() {
    applicationEvent.subscribe("changeDomain", updateFamilyList);
    applicationEvent.subscribe("changeDomain", updateAbstractList);
}

function changeDomain(value) {
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
