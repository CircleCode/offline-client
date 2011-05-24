const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/storageManager.jsm");
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

function openDocument(initid, mode) {
    var template;
    var box, tabPanel, tabBox, tab, tabId, tabPanelId;
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
            if(! mode || (mode === 'view') ){
                template = templates.viewtemplate;
            } else if(mode === 'edit'){
                template = templates.edittemplate;
            } else {
                throw new ArgException("openDocument :: mode must either be 'edit' or 'view'. ["+mode+"] is invalid");
            }
            if (!template) {
                logConsole("using [url(chrome://dcpoffline/content/templates/document-animal.xml#document-animal)] as default template");
                template = "url(chrome://dcpoffline/content/templates/document-animal.xml#document-animal)";
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
