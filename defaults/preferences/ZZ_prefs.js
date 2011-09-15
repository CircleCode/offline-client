/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero
 *          General Public License
 */

/**
 * First loaded prefs file - Can be overloaded
 */

pref("toolkit.defaultChromeURI", "chrome://dcpoffline/content/main.xul");
pref("toolkit.defaultChromeFeatures", "chrome,resizable=yes,dialog=no");
pref("toolkit.singletonWindowType", "dcpoffline-main");

/* enable js strict mode */
pref("javascript.options.strict", true);


/* application prefs */
// TODO all notations to update and merge with recent
pref("dcpoffline.storage.fileName", "storage.sqlite");
pref("dcpoffline.storage.location", "ProfD");
pref("dcpoffline.domain", "default");
pref("dcpoffline.context.url", "");
pref("dcpoffline.online.url", "");

pref("offline.user.login", "");
pref("offline.user.password", "");
pref("offline.user.applicationURL", "");

pref("offline.application.modeOffline", false);

/* let the OS handle http links */
pref("network.protocol-handler.expose.http", false);
pref("network.protocol-handler.warn-external.http", false);

/* debug prefs */
/*
pref("offline.application.debug.locale", "kl_GN");
pref("general.useragent.locale", "kl_GN");

pref("browser.dom.window.dump.enabled", true);
pref("javascript.options.showInConsole", true);
pref("nglayout.debug.disable_xul_cache", true);
pref("nglayout.debug.disable_xul_fastload", true);
pref("dom.report_all_js_exceptions", true);
*/
