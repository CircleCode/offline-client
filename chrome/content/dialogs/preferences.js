const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;


Cu.import("resource://modules/preferences.jsm");
Cu.import("resource://modules/events.jsm");

function deleteUserPref() {
    Preferences.resetBranch("offline.user.");
    applicationEvent.publish("close");
}

function deleteCurrentSelectedDocPref() {
    Preferences.resetBranch("offline.user.currentOpenDocuments");
    applicationEvent.publish("postUpdateOpenDocuments");
    alert("done");
    window.close();
}