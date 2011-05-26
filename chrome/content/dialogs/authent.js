const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/authentifier.jsm");
Cu.import("resource://modules/network.jsm");
Cu.import("resource://modules/preferences.jsm");
Cu.import("resource://modules/events.jsm");

/**
 * Try to log with the information of the dialog
 * 
 * @returns {Boolean}
 */
function doOk() {
    log('Authent : doOk');

    /*
     * var authentInfo = { login : document.getElementById('login').value,
     * password : document.getElementById('password').value };
     * 
     * var authentSuccess = authentificator.authentify(authentInfo);
     * 
     * if (authentSuccess) { log('authentication for [' + authentInfo.login +
     * '@' + authentInfo.dynacaseUrl + ' suceeded'); } else {
     * log('authentication for [' + authentInfo.login + '@' +
     * authentInfo.dynacaseUrl + ' failed'); return false; }
     */
    // TODO use the form value to log
    var login = document.getElementById('login').value;
    var password = document.getElementById('password').value;
    var applicationURL = document.getElementById('applicationURL').value;
    var remember = document.getElementById('remember').checked;

    if (remember) {
        Preferences.set("offline.user.login", login);
        Preferences.set("offline.user.password", password);
        Preferences.set("offline.user.applicationURL", applicationURL);
    }

    var authentSuccess = true;

    if (authentSuccess) {

        return true;
    }else {

        return false;
    }


}
/**
 * Quit the application
 * 
 * @returns {Boolean}
 */
function doCancel() {
    logConsole('Authent : doCancel');

    if (applicationEvent.publish("preClose")) {
        applicationEvent.publish("close");
    }

    return false;
}

/**
 * Init the dialog
 * 
 * @returns {Boolean}
 */
function doLoad() {
    logDebug('Authent  : doLoad');

    // TODO get real values from the application
    document.getElementById('login').value = Preferences.get("offline.user.login", "");
    document.getElementById('password').value = Preferences.get("offline.user.password", "");
    document.getElementById('applicationURL').value = Preferences.get("offline.user.applicationURL", "");
    document.getElementById('remember').checked = true;

    return true;
}