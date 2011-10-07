/**
 * translate function in from main.properties
 */
Components.utils.import("resource://modules/StringBundle.jsm");

var EXPORTED_SYMBOLS = [ "getText" ];

var getText= function (text) {
    var translate=new StringBundle("chrome://dcpoffline/locale/main.properties");
    try {
        var traduction=translate.get(text);
        if (traduction) return traduction;
        else return text;
    } catch (e) {
        
    }
    return '(no translation) '+text;
}