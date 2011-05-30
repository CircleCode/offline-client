var EXPORTED_SYMBOLS = [ "formater" ];

Components.utils.import("resource://modules/exceptions.jsm");
Components.utils.import("resource://modules/storageManager.jsm");
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
    if (config && config.key && config.attrid && config.famid) {
        
        var r = storageManager
        .execQuery({
            query : 'select label from enums where famid=:famid and attrid = :attrid and key=:key',
            params : {
                famid : config.famid,
                key:config.key,
                attrid:config.attrid
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
    if (config && config.initid) {
        var r = storageManager
        .execQuery({
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
var formater = new ProtoFormater();
