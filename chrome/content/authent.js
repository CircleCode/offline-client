//Components.utils.import("chrome://dcpoffline/content/network.jsm");
//Components.utils.import("chrome://dcpoffline/content/logger.jsm");
Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/authentifier.jsm");
Components.utils.import("resource://modules/network.jsm");

function doOk() {
	log('doOk');
	var rememberLogin = document.getElementById('rememberLogin').getAttribute(
			'checked');
	var rememberPassword = document.getElementById('rememberLogin')
			.getAttribute('checked');

	var authentInfo = {
		login : document.getElementById('login').value,
		password : document.getElementById('password').value
	};

	var authentSuccess = authentificator.authentify(authentInfo);

	if (authentSuccess) {
		log('authentication for [' + authentInfo.login + '@'
				+ authentInfo.dynacaseUrl
				+ ' suceeded');
	} else {
		log('authentication for [' + authentInfo.login + '@'
				+ authentInfo.dynacaseUrl
				+ ' failed');
		return false;
	}

	return true;
}

function doCancel() {
	log('doCancel');
	return true;
}

function doLoad() {
	log('doLoad');
	return true;
}