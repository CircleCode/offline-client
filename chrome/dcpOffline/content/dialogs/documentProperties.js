function doLoad() {
    var localDocument = window.arguments[0].localDocument;

    Components.utils.import("resource://modules/preferences.jsm");
    Components.utils.import("resource://modules/storageManager.jsm");
    Components.utils.import("resource://modules/StringBundle.jsm");
    var translate = new StringBundle(
            "chrome://dcpoffline/locale/documentProperties.properties");

    // set icon
    Components.utils.import("resource://modules/formater.jsm");
    var icon = localDocument.getIcon();

    if (icon) {
        var iconFile = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
        iconFile.initWithPath(icon);
        icon = formater.getURI({
            file : iconFile
        }).spec;
        document.getElementById('document-icon').src = icon;
    }

    // set title
    document.getElementById('document-title').value = localDocument.getTitle();

    // set editablevar
    var canEdit = localDocument.canEdit()
            ? "documentProperties.canEdit"
            : "documentProperties.canNotEdit";
    document.getElementById('editable').value = translate.get(canEdit);

    // set server link
    var serverLink = document.getElementById('serverLink');
    if (!localDocument.isOnlyLocal()) {
        var serverUrl = Preferences.get('dcpoffline.url.browser');
        if (serverUrl) {
            var documentUrl = serverUrl
                    + "&app=FDL&action=OPENDOC&&mode=view&referer=dcpoffline&id="
                    + localDocument.getInitid();
            serverLink.value = serverUrl;
            serverLink.href = documentUrl;
            serverLink.tooltipText = documentUrl;
        }
    }

    // get and set last Synchro Date and last Modif Date
    var r = storageManager.execQuery({
        query : "select * from synchrotimes where initid=:initid",
        params : {
            initid : localDocument.getInitid()
        }
    });
    if (r.length == 1) {
        if (r[0].lastsavelocal) {
            document.getElementById('lastModifDate').value = new Date(
                    r[0].lastsavelocal).toLocaleFormat("%x");
        }
        if (r[0].lastsynclocal) {
            document.getElementById('lastSynchroDate').value = new Date(
                    r[0].lastsynclocal).toLocaleFormat("%x");
            var locallyModified = (r[0].lastsavelocal > r[0].lastsynclocal)
                    ? "documentProperties.locallyModified"
                    : "documentProperties.locallyNotModified";
        } else {
            document.getElementById('lastSynchroDate').value = translate
                    .get('documentProperties.neverSynchronized');
            var locallyModified = "documentProperties.locallyModified";
        }
        document.getElementById('locallyModified').value = translate
                .get(locallyModified);
    } else {
        alert("an error occured when retrieving document properties");
    };
}