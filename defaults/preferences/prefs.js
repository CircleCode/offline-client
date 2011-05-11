/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero
 *          General Public License
 */

pref("toolkit.defaultChromeURI", "chrome://dcpoffline/content/main.xul");
// pref("toolkit.defaultChromeFeatures", "");
// pref("toolkit.singletonWindowType", "MyDomain");

/* enabling password manager */
// pref("signon.rememberSignons", true);
// pref("signon.expireMasterPassword", false);
// pref("signon.SignonFileName", "signons.txt");

/* debugging prefs */
pref("browser.dom.window.dump.enabled", true);
pref("javascript.options.showInConsole", true);
pref("javascript.options.strict", true);
pref("nglayout.debug.disable_xul_cache", true);
pref("nglayout.debug.disable_xul_fastload", true);
pref("dom.report_all_js_exceptions", true);

pref("general.useragent.locale", "fr-FR");

/* application prefs */
//pref("dcpoffline.storage.location", "chrome://content/db/storage.sqlite");
pref("dcpoffline.storage.fileName", "storage.sqlite");
pref("dcpoffline.storage.location", "ProfD");

pref("dcpoffline.context.url", "http://dynacase.r2d2/dev/");

pref("dcpoffline.online.url", "http://dynacase.r2d2/dev/");

pref("dcpoffline.domain", "default");