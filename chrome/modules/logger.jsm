const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logfile.jsm");

var EXPORTED_SYMBOLS = ["logDebug", "logError", "logTime", "log"];

const debugOutput = true;
const debugMaxDepth = 2;

var dinit=new Date().getTime();
var dlast=dinit;

var log = function log(config) {
    logFile.write(config);
};

var logError = function logError(aMessage){
    logFile.write({message:aMessage, priority:log.ERR});
    return Cu.reportError(aMessage);
}

var logDebug = function logDebug(msg) {
    logFile.write({message:msg, priority:logFile.DEBUG});
};

var logTime = function logTime(msg, obj) {
    var dloc=new Date().getTime();
    var prefix= (dloc - dinit)/1000 + 's['+(dloc-dlast)/1000+']:';
    if (obj) _log(obj, prefix+msg);
    else _log( prefix+msg);
    dlast=dloc;
    logFile.write({message:msg, priority:logFile.DEBUG});
}

_log = function() {
    var consoleService = Cc["@mozilla.org/consoleservice;1"]
    .getService(Ci.nsIConsoleService);

    var ddump = function(text, ret) {
        if (debugOutput)
            consoleService.logStringMessage("[DEBUG] " + text + "\n");
    };
    var ddumpObject = function(obj, name, maxDepth, curDepth, ret) {
        if (!debugOutput)
            return '';
        if (curDepth == undefined)
            curDepth = 0;
        if (maxDepth != undefined && curDepth > maxDepth)
            return '';

        var i = 0, msg = '';
        var indent = "\n";
        for ( var j = 0; j <= curDepth; j++) {
            indent += "\t";
        }
        for (prop in obj) {
            i++;
            try {
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
            } catch (e) {}
        }
        if (!i)
            msg = "<empty>";
        var out = (name ? name + " : " : '') + msg;
        if (ret)
            return out;
        else
            ddump(out);
        return '';
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

