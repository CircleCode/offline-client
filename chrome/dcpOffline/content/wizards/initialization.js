const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/events.jsm");
Cu.import("resource://modules/StringBundle.jsm");
Cu.import("resource://modules/preferences.jsm");
Cu.import("resource://modules/logger.jsm");

/* Wizard Method  */

function initWizard() {
    applicationEvent.subscribe("authentSuccess", authentNextStep);
    applicationEvent.subscribe("authentError", prepareAuthent);
    applicationEvent.subscribe("unableToSynchronize", displayError);
    applicationEvent.subscribe("postSynchronize", displayEndOfSynchronize);
}

function wizardEnd() {
    Preferences.set("offline.application.firstRun", false);
    applicationEvent.publish("initializationWizardEnd");
    applicationEvent.unsubscribe("authentOK", authentNextStep);
    applicationEvent.unsubscribe("unableToSynchronize", displayError);
    applicationEvent.unsubscribe("postSynchronize", displayEndOfSynchronize);
}

function wizardRewind() {
    document.getElementById('theWizard').canAdvance = true;
    return false;
}

function tryToClose() {
    if (applicationEvent.publish("preClose")) {
        applicationEvent.publish("close");
    }
    return false;
}

/* Authent Method  */

function wizardInitAuthent() {
	prepareAuthent();
    initIHM();
}

function authentNextStep() {
    var translate = new StringBundle("chrome://dcpoffline/locale/wizard.properties");
    document.getElementById('authent.applicationURL').disabled = true;
    document.getElementById('wizardTryToAuthent').disabled = false;
    document.getElementById('authent.login').disabled = false;
    document.getElementById('authent.password').disabled = false;
    document.getElementById('authent.remember').disabled = false;
    document.getElementById('authent.modeOffline').disabled = true;
    document.getElementById('authent.autoLogin').disabled = false;
    document.getElementById('authent.progressGroup').hidden = true;
    document.getElementById('theWizard').canAdvance = true;
    document.getElementById('authent.errorLabel').value = translate.get("initialization.authentOKNextstep");
    document.getElementById('authent.errorGroup').style.visibility = "visible";
}

function wizardAuthent() {
    document.getElementById('authent.applicationURL').disabled = true;
    document.getElementById('wizardTryToAuthent').disabled = true;
    document.getElementById('theWizard').canAdvance = false;
    document.getElementById('theWizard').canRewind = false;
    tryToAuthent();
}

function prepareAuthent() {
	Preferences.set("offline.application.rememberLogin", false);
	Preferences.set("offline.application.modeOffline", false);
	Preferences.set("offline.application.autoLogin", false);
	document.getElementById('authent.modeOffline').disabled = true;
    document.getElementById('authent.applicationURL').disabled = true;
    document.getElementById('wizardTryToAuthent').disabled = false;
    document.getElementById('theWizard').canAdvance = false;
}

/* Synchro Method  */

function initSynchroElement() {
	refreshDomain(); 
	initSynchronize();
	document.getElementById('theWizard').canRewind = false;
}

function refreshDomain() {
    document.getElementById("domainPopupList").builder.rebuild();
    document.getElementById('theWizard').canAdvance = false;
    document.getElementById("domainList").selectedIndex = 1;
    changeDomain(document.getElementById("domainList").selectedItem.value);
}

function changeDomain(value) {
    var param = {};
    if (value) {
        param.domainId = value
    }
    applicationEvent.publish("changeSelectedDomain", param);
    applicationEvent.publish("postChangeSelectedDomain", param);
}

function wizardSynchronize() {
    document.getElementById('theWizard').canAdvance = false;
    document.getElementById("wizardTryToSynchronize").disabled = true;
    document.getElementById('theWizard').canAdvance = false;
    document.getElementById('theWizard').canRewind = false;
    tryToSynchronize();
}

function displayError(error) {
    var translate = new StringBundle("chrome://dcpoffline/locale/main.properties");
    Services.prompt.alert(null, translate.get("synchronize.unable"), error.reason);
    document.getElementById("wizardTryToSynchronize").disabled = false;
}

function displayEndOfSynchronize(result) {
    openDialog("chrome://dcpoffline/content/dialogs/endOfSynchronize.xul", "", "chrome,modal,close=false", result);
    document.getElementById("wizardTryToSynchronize").disabled = false;
    document.getElementById('theWizard').canAdvance = true;
}