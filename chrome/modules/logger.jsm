const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
var EXPORTED_SYMBOLS = ["log", "logError"];

const debugOutput = true;
debugMaxDepth = 25;

log = function() {
    var consoleService = Cc["@mozilla.org/consoleservice;1"]
            .getService(Ci.nsIConsoleService);

    var ddump = function(text, ret) {
        if (debugOutput)
            consoleService.logStringMessage("[DEBUG] " + text + "\n");
    };
    var ddumpObject = function(obj, name, maxDepth, curDepth, ret) {
        if (!debugOutput)
            return;
        if (curDepth == undefined)
            curDepth = 0;
        if (maxDepth != undefined && curDepth > maxDepth)
            return;

        var i = 0, msg = '';
        var indent = "\n";
        for ( var j = 0; j <= curDepth; j++) {
            indent += "\t";
        }
        for (prop in obj) {
            i++;
            if (typeof (obj[prop]) == "object") {
                if (obj[prop] && obj[prop].length != undefined)
                    msg += indent + prop + "=[probably array, length "
                            + obj[prop].length + "]";
                else
                    msg += indent + prop + "=[" + typeof (obj[prop]) + "]";

                msg += indent
                        + ddumpObject(obj[prop], prop, maxDepth, curDepth + 1,
                                true);
            } else if (typeof (obj[prop]) == "function")
                msg += indent + prop + "=[function]", ret;
            else
                msg += indent + prop + "=" + obj[prop];
        }
        if (!i)
            msg = "<empty>";
        var out = (name ? name + " : " : '') + msg;
        if (ret)
            return out;
        else
            ddump(out);
    };
    var dumpError = function(text) {
        dump("[ERROR]" + text + "\n");
    };

    return function(aMessage, name) {
        switch (typeof aMessage) {
            case 'function' :
            case 'object' :
                ddumpObject(aMessage, name?name:'', debugMaxDepth);
                break;
            default :
                ddump((name ? (name + ': ') : '') + aMessage);
        }
    };
}();

function logError(aMessage){
    return Cu.reportError('aMessage');
}

log('logger loaded');