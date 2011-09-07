Components.utils.import("resource://gre/modules/Services.jsm");

function init(aEvent) {
    if (aEvent.target != document)
        return;

    var version = Services.appinfo.version;
    var buildID = Services.appinfo.appBuildID;
    document.getElementById("appVersion").value += version + " (" + buildID + ")";

    var version = Services.appinfo.platformVersion;
    var buildID = Services.appinfo.platformBuildID;
    document.getElementById("platformVersion").value += version + " (" + buildID + ")";

    var productName = Services.appinfo.name;
    var productVendor = Services.appinfo.vendor;
    document.getElementById("productName").value = productName + " by " + productVendor;
}
