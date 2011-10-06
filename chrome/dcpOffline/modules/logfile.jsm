var EXPORTED_SYMBOLS = ["logFile"];

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://modules/utils.jsm");

function logFileSingleton() {
};
logFileSingleton.prototype = {
    EMERG : 'EMERG',// 0, // RFC 3164
    ALERT : 'ALERT', // 1,
    CRIT : 'CRIT', // 2, // Critique : etats critiques
    ERR : 'ERR', // 3, // Erreur: etats d'erreur
    WARN : 'WARN',// 4, // Avertissement: etats d'avertissement
    NOTICE : 'NOTICE',// 5, // Notice: normal mais état significatif
    INFO : 'INFO',// 6, // Information: messages d'informations
    DEBUG : 'DEBUG', // 7, // Debug: messages de

    logDailyFile : null,

    getLogFile : function() {
        if (!this.logDailyFile) {
            this.logDailyFile = Services.dirsvc.get("ProfD",
                    Components.interfaces.nsILocalFile);
            this.logDailyFile.append("Logs");
            if (!this.logDailyFile.exists() || !this.logDailyFile.isDirectory()) { // if
                // it
                // doesn't
                // exist,
                // create
                this.logDailyFile.create(
                        Components.interfaces.nsIFile.DIRECTORY_TYPE, 0750);
            }
            var now = new Date();
            this.logDailyFile.append("trace-" + now.toISOString() + ".log");
        }
        return this.logDailyFile;
    },
    /**
     * @param config -
     *            message : {string} message code : {string} code priority : one
     *            of EMERG, WARN, INFO, .... (default is NOTICE)
     */
    write : function(config) {
        var message = '';
        var code = '';
        var priority = this.NOTICE;
        if (typeof config == 'object') {
            if (config.message) {
                message = config.message;
            }
            if (config.priority)
                priority = config.priority;
            if (config.code)
                code = config.code;
        } else if (typeof config == 'string') {
            message = config;
        } else {
            message = typeof config;
        }
        if (message) {
            var file = this.getLogFile();
            // file is nsIFile, data is a string
            var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                    .createInstance(Components.interfaces.nsIFileOutputStream);

            var data = utils.toIso8601(new Date(), true);
            data += '[' + priority + ']';
            data += '[' + code + ']';
            data += '[' + message + ']';
            data += "\n";
            // use 0x02 | 0x10 to open file for appending.
            foStream.init(file, 0x02 | 0x08 | 0x10, 0666, 0);
            // write, create, truncate
            // In a c file operation, we have no need to set file mode with or
            // operation,
            // directly using "r" or "w" usually.

            // if you are sure there will never ever be any non-ascii text in
            // data
            // you can
            // also call foStream.writeData directly
            var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
                    .createInstance(Components.interfaces.nsIConverterOutputStream);
            converter.init(foStream, "UTF-8", 0, 0);
            converter.writeString(data);
            converter.close(); // this closes foStream
        }
    }
};
var logFile = new logFileSingleton();
