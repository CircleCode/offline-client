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



/* application prefs */
// TODO all notations to update and merge with recent
pref("dcpoffline.storage.fileName", "storage.sqlite");
pref("dcpoffline.storage.location", "ProfD");
pref("dcpoffline.domain", "default");
pref("dcpoffline.context.url", "http://dynacase.r2d2/dev/");
pref("dcpoffline.online.url", "http://dynacase.r2d2/dev/");

pref("offline.user.login", "");
pref("offline.user.password", "");
pref("offline.user.applicationURL", "http://dynacase.r2d2.paris.lan/dev/");

pref("offline.application.modeOffline", false);

/* debug prefs */
pref("offline.application.debug.locale", "kl_GN");
pref("general.useragent.locale", "kl_GN");
