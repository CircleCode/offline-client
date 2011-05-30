// start_venkman();

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/docManager.jsm");
Cu.import("resource://modules/storageManager.jsm");

/* enabling password manager */
Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);

/* debug stuff */

/* required for venkman */
function toOpenWindowByType(inType, uri) {
    var winopts = "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar";
    window.open(uri, "_blank", winopts);
}

function changeTab(){
    var tabIndex = {
        value : '0'
    };
    var result = Services.prompt.prompt(null, "Tab index",
            "enter tab index", tabIndex, null, {});
    if (result) {
        document.getElementById('onefam-content-tabbox').tabs.selectedIndex = tabIndex.value;
    };
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
                logConsole("using [file:///media/Data/Workspaces/xul/offline-client/chrome/content/bindings/families/document-ZOO_ANIMAL-Binding.xml#document-ZOO_ANIMAL-view)] as default template");
                template = "url(file:///media/Data/Workspaces/xul/offline-client/chrome/content/bindings/families/document-ZOO_ANIMAL-Binding.xml#document-ZOO_ANIMAL-view)";
            }
            logConsole(template);
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

function testBinding() {
    var docid = {
        value : ''
    };
    var result = Services.prompt.prompt(null, "Test Binding",
            "enter document id", docid, null, {});
    if (result) {
        openDocument(docid.value);
    };
}

function customDebug(level) {
    log("starting customDebug at level " + level);
}