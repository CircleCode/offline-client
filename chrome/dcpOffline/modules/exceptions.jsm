Components.utils.import("resource://modules/logfile.jsm");

var EXPORTED_SYMBOLS = [ "ArgException", "SyncException" , "StorageException", "BindException", "attrCheckException", "IHMException"];
function ArgException(message) {
    this.message = message;
    logFile.write({
        message : message,
        priority : logFile.ERR
    });
}
ArgException.prototype = {
    code : Components.results.NS_ERROR_INVALID_ARG,
    toString : function() {
        return this.message;
    },
    valueOf : function() {
        return this.code;
    }
};

function SyncException(message) {
    this.message = message;
    logFile.write({
        message : message,
        priority : logFile.ERR
    });
}
SyncException.prototype = {
    code : 'storage',
    toString : function() {
        Components.utils.import("resource://modules/fdl-context.jsm");
        if (context) {
            this.message += ':' + context.getLastErrorMessage();
        }
        return this.message;
    },
    valueOf : function() {
        return this.code;
    }
};


function StorageException(message) {
    this.message = message;
    logFile.write({
        message : message,
        priority : logFile.ERR
    });
}
StorageException.prototype = {
    code : 3401,
    toString : function() {
        return this.message;
    },
    valueOf : function() {
        return this.code;
    }
};

function BindException(message) {
    this.message = message;
    logFile.write({
        message : message,
        priority : logFile.ERR
    });
};
BindException.prototype = {
    code : 'binding',
    toString : function() {
        return this.message;
    },
    valueOf : function() {
        return this.code;
    }
};

function IHMException(message) {
    this.message = message;
    logFile.write({
        message : message,
        priority : logFile.ERR
    });
};
BindException.prototype = {
    code : 'IHM',
    toString : function() {
        return this.message;
    },
    valueOf : function() {
        return this.code;
    }
};

function attrCheckException(message) {
    this.message = message;
    logFile.write({
        message : message,
        priority : logFile.ERR
    });
};
attrCheckException.prototype = {
    code : 'invalidAttrValue',
    toString : function() {
        return this.message;
    },
    valueOf : function() {
        return this.code;
    }
}; 