Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://modules/StringBundle.jsm");
Components.utils.import("resource://modules/events.jsm");

window.onload = function() {
    applicationEvent.subscribe("unableToSynchronize", displayError);
    applicationEvent.subscribe("postSynchronize", displayEndOfSynchronize);
    initSynchronize();
};

function displayError(error) {
    var translate = new StringBundle("chrome://dcpoffline/locale/main.properties");
    suppressListener();
    window.close();
    Services.prompt.alert(null, translate.get("synchronize.unable"), error.reason);
}

function displayEndOfSynchronize(result) {
    var translate = new StringBundle("chrome://dcpoffline/locale/main.properties");
    suppressListener();
    openDialog("chrome://dcpoffline/content/dialogs/endOfSynchronize.xul", "", "chrome,modal,close=false", result);
    window.close();
}

function suppressListener() {
    applicationEvent.unsubscribe("unableToSynchronize", displayError);
    applicationEvent.unsubscribe("postSynchronize", displayEndOfSynchronize);
}

function letSynchronize() {
    document.getElementById("synchronizeButton").disabled = true;
    document.getElementById("cancelButton").disabled = true;
    tryToSynchronize();
}