Components.utils.import("resource://gre/modules/Services.jsm");

function init(aEvent) {
    if (aEvent.target != document)
        return;

    var version = Services.appinfo.version;
    var buildID = Services.appinfo.appBuildID;
    document.getElementById("appVersion").value += version + " (build " + buildID + ")";

    version = Services.appinfo.platformVersion;
    buildID = Services.appinfo.platformBuildID;
    document.getElementById("platformVersion").value += version + " (build " + buildID + ")";

    version = Services.prefs.getCharPref('offline.server.version');
    document.getElementById("serverVersion").value += version;
}
