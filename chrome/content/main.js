const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/docManager.jsm");

/* enabling password manager */
Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);

/* debug stuff */

/* required for venkman */
function toOpenWindowByType(inType, uri) {
    var winopts = "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar";
    window.open(uri, "_blank", winopts);
}

function openLoginDialog() {
    window.openDialog("chrome://dcpoffline/content/dialogs/authent.xul", "",
            "chrome,modal");
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

/* some tests */
function customDebug(level) {
    log("starting customDebug at level " + level);

    Components.utils.import("resource://modules/storageManager.jsm");

    var C = new Fdl.Context({
        // url : "http://dynacase.r2d2.paris.lan/dev/"
        url : "http://localhost/eric/"
    });
    if (!C.isAuthenticated()) {
        var u = C.setAuthentification({
            login : 'nono',
            password : 'anakeen'
        });
        if (!u)
            alert('error authent:' + C.getLastErrorMessage());
    }

    log("context is authenticated");

    switch (level) {
    case 1:

        var fam = C.getDocument({
            id : 'ZOO_ANIMAL'
        });
        var r1 = storageManager
                .execQuery({
                    query : "insert into families(famid, name, json_object) values(:famid, :famname, :fam)",
                    params : {
                        famid : fam.getProperty('id'),
                        famname : fam.getProperty('name'),
                        fam : JSON.stringify(fam)
                    }
                });

        log(r1, "family is stored");

        break;
    case 2:

        var fam = C.getDocument({
            id : 'ZOO_ANIMAL'
        });

        var r2 = storageManager.initFamilyView(fam);

        log(r2, "familyView is initialised");
        break;
    case 3:
        for ( var i = 0; i < 10; i++) {

            var animal = C.getDocument({
                id : 1080 + i
            });
            var r3 = storageManager.saveDocumentValues({
                properties : animal.getProperties(),
                attributes : animal.getValues()
            });

            log(r3, "document is saved");
        }
    }

}