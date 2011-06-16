var EXPORTED_SYMBOLS = [ "formater" ];

Components.utils.import("resource://modules/exceptions.jsm");
Components.utils.import("resource://modules/storageManager.jsm");
Components.utils.import("resource://modules/preferences.jsm");
Components.utils.import("resource://modules/utils.jsm");
Components.utils.import("resource://modules/logger.jsm");

function ProtoFormater(config) {

};

ProtoFormater.prototype = {
    toString : function() {
        return 'formater';
    }
};
/**
 * 
 * @param config
 *            key attrid famid
 * @returns
 */
ProtoFormater.prototype.getEnumLabel = function(config) {
    if (config && config.hasOwnProperty('key') && config.attrid && config.famid) {

        var r = storageManager
                .execQuery({
                    query : 'select label from enums where famid=:famid and attrid = :attrid and key=:key',
                    params : {
                        famid : config.famid,
                        key : config.key,
                        attrid : config.attrid
                    }
                });
        if (r.length == 1) {
            return (r[0].label);
        }
        return config.key;
    } else {
        throw new ArgException("getEnumLabel need key, attrid, famid");
    }
};

/*
 * @param config initid attrid famid @returns
 */
ProtoFormater.prototype.getDocumentTitle = function(config) {
    if (config && (!isNaN(config.initid))) {
        var r = storageManager.execQuery({
            query : 'select title from doctitles where initid=:initid',
            params : {
                initid : config.initid
            }
        });
        if (r.length == 1) {
            return (r[0].title);
        }
        return "no title:" + config.initid;
    } else {
        throw new ArgException("getDocumentTitle need initid");
    }
};

ProtoFormater.prototype.getURI = function(config) {
    if (config && config.file){
        var ios = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
        return ios.newFileURI(config.file);
    } else {
        throw new ArgException("getUri need file");
    }
};

/*
 * @deprecated
 * @param string isoDate YYYY-MM-DD
 */
ProtoFormater.prototype.getLocaleDate = function(isoDate) {
    if (isoDate) {
        try {
            var locale = JSON.parse(Preferences.get("offline.user.localeFormat"));

            
            var date = null;

            var format = '';
            if (/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}[ |T][0-9]{2}:[0-9]{2}/.test(isoDate)) {
                date = new Date(isoDate.substring(0, 4), isoDate
                        .substring(5, 7) - 1, isoDate.substring(8, 10), isoDate
                        .substring(11, 13), isoDate.substring(14, 16), isoDate
                        .substring(17, 19));
                format = locale.dateTimeFormat; // %d/%m/%Y %H:%M
            } else if (/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}/.test(isoDate)) {
                date = new Date(isoDate.substring(0, 4), isoDate
                        .substring(5, 7) - 1, isoDate.substring(8, 10));
                format = locale.dateFormat; // %d/%m/%Y
            }
            if (date) {
                format = format.replace('%Y', date.getFullYear());
                format = format.replace('%d', utils.twoDigits(date.getDate()));
                format = format.replace('%m', utils
                        .twoDigits(date.getMonth() + 1));
                format = format.replace('%H', utils.twoDigits(date.getHours()));
                format = format.replace('%M', utils
                        .twoDigits(date.getMinutes()));
                format = format.replace('%S', utils
                        .twoDigits(date.getSeconds()));

                return format;
            }
        } catch (e) {
        }
    }

    return isoDate;
};

var formater = new ProtoFormater();
