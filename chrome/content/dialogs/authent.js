const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/authentifier.jsm");
Cu.import("resource://modules/preferences.jsm");
Cu.import("resource://modules/events.jsm");

/**
 * Try to log with the information of the dialog
 * 
 * @returns {Boolean}
 */
function doOk() {
    logIHM('Authent : doOk');

    var login = document.getElementById('login').value;
    var password = document.getElementById('password').value;
    var remember = document.getElementById('remember').checked;

    if (remember) {
        Preferences.set("offline.user.login", login);
        Preferences.set("offline.user.password", password);
    }

    tryToAuthent();
    return false;
}
/**
 * Quit the application
 * 
 * @returns {Boolean}
 */
function doCancel() {
    logIHM('Authent : doCancel');

    if (applicationEvent.publish("preClose")) {
        applicationEvent.publish("close");
    }

    return false;
}

function tryToAuthent() {
    logIHM("Authent : try to authent");
    
    document.getElementById('login').disabled = true;
    document.getElementById('password').disabled = true;
    document.getElementById('remember').disabled = true;
    
    document.getElementById('progressGroup').hidden = false;
    
  //get last value
    var currentLogin = document.getElementById('login').value;
    var currentPassword = document.getElementById('password').value;
    var currentApplicationURl = Preferences.get("offline.user.applicationURL", "");
    
    //var modeOffline = Preferences.get("offline.application.modeOffline", false);
    var modeOffline = false;
    var authentReturn ;
    
    authentReturn = authentificator.authent(modeOffline, currentLogin, currentPassword, currentApplicationURl);
    
    logIHM(authentReturn.result);
    
    if (authentReturn.result) {
        window.close();
    }else {
        logIHM(authentReturn.reason);
        document.getElementById('login').disabled = false;
        document.getElementById('password').disabled = false;
        document.getElementById('remember').disabled = false;
        document.getElementById('progressGroup').hidden = true;
    }
}

function doLoad() {
    logIHM('Authent  : doLoad');
    
    //Update IHM
    
    document.getElementById('login').value = Preferences.get("offline.user.login", "");
    document.getElementById('password').value = Preferences.get("offline.user.password", "");
    document.getElementById('applicationURL').value = Preferences.get("offline.user.applicationURL", "");
    
    setTimeout(tryToAuthent, 10);
    
}

function logIHM(message) {
    logConsole(message);
}