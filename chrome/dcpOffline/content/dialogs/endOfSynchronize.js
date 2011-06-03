Components.utils.import("resource://modules/StringBundle.jsm");

function initDialog() {
    var translate = new StringBundle("chrome://dcpoffline/locale/main.properties");
    var result = window.arguments[0];
    
    dump(JSON.stringify(result));
    
    if (result.description.status) {
        document.getElementById("resultLabel").value = result.description.status;
    } else {
        if (result.result) {
            document.getElementById("resultLabel").value = translate.get("synchronize.success");
        }else {
            document.getElementById("resultLabel").value = translate.get("synchronize.fail");
        }
    }
    if (result.description.manageWaitingUrl) {
        document.getElementById("report").hidden = false;
        document.getElementById("report").href = result.description.manageWaitingUrl;
    }
    if (result.description.message) {
        document.getElementById("message").hidden = false;
        document.getElementById("message").value = result.description.message;
    }
}