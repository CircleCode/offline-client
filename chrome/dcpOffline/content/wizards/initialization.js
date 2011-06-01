const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/events.jsm");
Cu.import("resource://modules/StringBundle.jsm");
Cu.import("resource://modules/preferences.jsm");

function initFirstAuthent() {
    initIHM();
    document.getElementById('authent.applicationURL').disabled = false;
    document.getElementById('theWizard').canAdvance = false;
    applicationEvent.subscribe("authentOK", authentNextStep);
}

function authentNextStep() {
    var translate = new StringBundle("chrome://dcpoffline/locale/wizard.properties");
    document.getElementById('authent.login').disabled = false;
    document.getElementById('authent.password').disabled = false;
    document.getElementById('authent.remember').disabled = false;
    document.getElementById('authent.modeOffline').disabled = false;
    document.getElementById('authent.autoLogin').disabled = false;
    document.getElementById('theWizard').canAdvance = true;
    document.getElementById('authent.progressGroup').hidden = true;
    document.getElementById('authent.errorLabel').value = translate.get("initialization.authentOKNextstep");
    document.getElementById('authent.errorGroup').style.visibility = "visible";
}

function wizardAuthent() {
    tryToAuthent();
}

function tryToClose() {
    if (applicationEvent.publish("preClose")) {
        applicationEvent.publish("close");
    }
    return false;
}

function wizardRewind() {
    document.getElementById('theWizard').canAdvance = true;
    return false;
}

function wizardEnd() {
    Preferences.set("offline.application.firstRun", false);
    applicationEvent.publish("initializationWizardEnd");
}