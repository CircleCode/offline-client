/**
 * Beware don't use const define here !!!!
 */

Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/authentifier.jsm");
Components.utils.import("resource://modules/preferences.jsm");
Components.utils.import("resource://modules/events.jsm");
Components.utils.import("resource://modules/passwordManager.jsm");

function tryToAuthent() {
    logIHM("Authent : try to authent");
    
    try{
        
        var param = {};
        param.currentLogin = document.getElementById('authent.login').value;
        param.currentPassword = document.getElementById('authent.password').value;
        param.currentApplicationURL = document.getElementById('authent.applicationURL').value;
        param.modeOffline = document.getElementById('authent.modeOffline').checked;
        
        if (document.getElementById('authent.remember').checked) {
            Preferences.set("offline.user.login", param.currentLogin);
        }
        
        Preferences.set("offline.application.rememberLogin", document.getElementById('authent.remember').checked);
        Preferences.set("offline.application.modeOffline", param.modeOffline);
        Preferences.set("offline.application.autoLogin", document.getElementById('authent.autoLogin').checked);
        
        
        document.getElementById('authent.login').disabled = true;
        document.getElementById('authent.password').disabled = true;
        document.getElementById('authent.remember').disabled = true;
        document.getElementById('authent.modeOffline').disabled = true;
        document.getElementById('authent.autoLogin').disabled = true;
        
        document.getElementById('authent.progressGroup').style.visibility = "visible";
        document.getElementById('authent.progressGroup').hidden = false;
        document.getElementById('authent.errorGroup').style.visibility = "hidden";
        
        authentificator.authent(param, onAuthentSuccess, onAuthentError);
        
        }catch (error){
            onLogError(error);
            logConsole('Authent : doOk '+error.message+" "+error.fileName+" "+error.lineNumber+" "+error);
            logDebug('Authent : doOk '+error.message+" "+error.fileName+" "+error.lineNumber+" "+error);
    }

}

function onAuthentSuccess() {
    Preferences.set("offline.user.applicationURL", document.getElementById('authent.applicationURL').value);
    applicationEvent.publish("authentSuccess");
}

function onAuthentError(reason) {
    logIHM("onLogError "+reason);

    if (reason) {
        document.getElementById('authent.errorLabel').value = reason;
        document.getElementById('authent.errorGroup').style.visibility = "visible";
        document.getElementById('authent.progressGroup').hidden = true;
    }
    
    document.getElementById('authent.login').disabled = false;
    document.getElementById('authent.password').disabled = false;
    document.getElementById('authent.remember').disabled = false;
    document.getElementById('authent.modeOffline').disabled = false;
    document.getElementById('authent.autoLogin').disabled = false;
    document.getElementById('authent.progressGroup').style.visibility = "hidden";
    applicationEvent.publish("authentError", reason);
}

function initIHM() {
    logIHM('Authent  : doLoad');
    
    //Update IHM
    
    var currentPassword;
    var login = Preferences.get("offline.user.login", "");
    var autologin = Preferences.get("offline.application.autoLogin", false);
    
    document.getElementById('authent.progressGroup').style.visibility = "hidden";
    document.getElementById('authent.errorGroup').style.visibility = "hidden";
    
    
    if (Preferences.get("offline.application.rememberLogin", false)) {
        document.getElementById('authent.login').value = login;
        currentPassword = passwordManager.getPassword(login);
        if (currentPassword) {
            document.getElementById('authent.password').value = currentPassword;
        }else{
            document.getElementById('authent.password').value = "";
        }
    }
    document.getElementById('authent.remember').checked = Preferences.get("offline.application.rememberLogin", false);
    document.getElementById('authent.modeOffline').checked = Preferences.get("offline.application.modeOffline", false);
    document.getElementById('authent.applicationURL').value = Preferences.get("offline.user.applicationURL", "");
    document.getElementById('authent.autoLogin').checked = autologin;
    
    if (autologin){
        setTimeout(tryToAuthent, 10);
    }
}

function logIHM(message, obj) {
    logConsole(message, obj);
}