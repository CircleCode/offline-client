Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/docManager.jsm");
// Components.utils.import("chrome://dcpoffline/content/logger.jsm");

/* enabling password manager */
Components.classes["@mozilla.org/login-manager;1"]
		.getService(Components.interfaces.nsILoginManager);

/* debug stuff */

/* required for venkman */
function toOpenWindowByType(inType, uri) {
	var winopts = "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar";
	window.open(uri, "_blank", winopts);
}

/* some tests */
function customDebug() {
	Components.utils.import("resource://modules/storageManager.jsm");
//	Components.utils.import("resource://modules/fdl-data-debug.jsm");

	var C = new Fdl.Context({
				url : "http://dynacase.r2d2.paris.lan/dev/"
			});
	if (!C.isAuthenticated()) {
		var u = C.setAuthentification({
					login : 'admin',
					password : 'anakeen'
				});
		if (!u)
			alert('error authent:' + C.getLastErrorMessage());
	}
	var fam = C.getDocument({
				id : 'ZOO_ANIMAL'
			});
            var famJS = fam.toJSON();
	storageManager.execQuery({
		query : "insert into families(famid, name, json_object) values(9999, 'ZOO_ANIMAL', :fam)",
		params : {
			fam : JSON.stringify(fam)
		}
	});
	storageManager.initFamilyView(fam);
}