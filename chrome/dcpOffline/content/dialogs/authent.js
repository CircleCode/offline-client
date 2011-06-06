const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/events.jsm");

/**
 * Try to log with the information of the dialog
 * 
 * @returns {Boolean}
 */
function doOk() {
    logIHM('Authent : doOk');
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


function doLoad() {
    logIHM('Authent  : doLoad');
    applicationEvent.subscribe("authentSuccess", closeDialog);
    initIHM();

}

function closeDialog() {
    window.close();
}
