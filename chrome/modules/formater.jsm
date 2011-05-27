var EXPORTED_SYMBOLS = [ "formater" ];

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

        return "label" + config.key;
    } else {
        throw new ArgException("getEnumLabel need key, attrid, famid");
    }
};

/*
 * @param config initid attrid famid @returns
 */
ProtoFormater.prototype.getDocumentTitle = function(config) {
    if (config && config.initid) {
        return "title" + config.initid;
    } else {
        throw new ArgException("getDocumentTitle need initid");
    }
};
var formater = new ProtoFormater();
