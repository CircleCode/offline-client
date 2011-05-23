const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/authentifier.jsm");
Cu.import("resource://modules/network.jsm");

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
    logConsole('login '+login);
    var password = document.getElementById('password').value;
    logConsole('password '+password);
    var applicationURL = document.getElementById('applicationURL').value;
    logConsole('applicationURL '+applicationURL);
    var remember = document.getElementById('remember').checked;
    logConsole('remember '+remember);

    var authentSuccess = (Math.floor(Math.random()*11) < 5 ) ? true : false;

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
    log('Authent : doCancel');
    
    Cc['@mozilla.org/toolkit/app-startup;1'].getService(Ci.nsIAppStartup).quit(Ci.nsIAppStartup.eAttemptQuit);
    
    return true;
}

/**
 * Init the dialog
 * 
 * @returns {Boolean}
 */
function doLoad() {
    logDebug('Authent  : doLoad');

    // TODO get real values from the application
    document.getElementById('login').value = "logindfdfdf";
    document.getElementById('password').value = "password";
    document.getElementById('applicationURL').value = "applicationURL";
    document.getElementById('remember').checked = true;

    return true;
}