Components.utils.import("resource://modules/preferences.jsm");
Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/fdl-data-debug.jsm");

//Components.utils.import("chrome://dcpoffline/content/fdl-data-debug.js");

var EXPORTED_SYMBOLS = [ "context" ];

var context = new Fdl.Context({
  url: Preferences.get('dcpoffline.context.url')
});


