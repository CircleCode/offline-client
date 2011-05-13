Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/network.jsm");
Components.utils.import("resource://modules/fdl-data-debug.jsm");
Components.utils.import("resource://modules/fdl-context.jsm");

var EXPORTED_SYMBOLS = ["authentificator"];

/**
 * 
 * @type
 */
var authentificator = {
	/**
	 * 
	 * @param {object}
	 *            config
	 */
	authentify : function(config) {
		if (config && config.domain && config.login && config.password) {
			if (networkChecker.isOffline()) {
				log('offlineAuthentication');
				log('offlineAuthentication is always trusted');
				alert("offline authentification is always trusted");
				// XXX (offline authent) should we really trust offline authent?
				return true;
			} else {
				log('onlineAuthentication');
				if (!context.isConnected({
							reset : true
						})) {
					dcpOffline
							.log("online authentication failed because context is not connected");
					return false;
				}
				// TODO

				if (context.setAuthentification({
							login : config.login,
							password : config.password
						})) {

				} else {
					var msg = context.getLastErrorMessage();
					alert(msg);
					log('authent failed : ' + msg);
					return false;
				}

				log("onlineAuthentication succeed");
				return true;
			}
		}
		log('authent failed');
		return false;
	},
	/**
	 * 
	 * @param {string}
	 *            domain the domain against which authentication should be
	 *            tested
	 */
	isAuthentified : function(domain) {

	}
};

log('authentifier loaded');