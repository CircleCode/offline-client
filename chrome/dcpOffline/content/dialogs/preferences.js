Components.utils.import("resource://modules/preferences.jsm");
Components.utils.import("resource://modules/events.jsm");

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