const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;


Cu.import("resource://modules/preferences.jsm");
Cu.import("resource://modules/events.jsm");

function destuctionTotal() {
    Preferences.resetBranch("offline.user.");
    applicationEvent.publish("close");
}