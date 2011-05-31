const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/network.jsm");
Cu.import("resource://modules/fdl-data-debug.jsm");
Cu.import("resource://modules/fdl-context.jsm");
Cu.import("resource://modules/offlineSynchronize.jsm");
Cu.import("resource://modules/preferences.jsm");
Cu.import("resource://modules/passwordManager.jsm");
Cu.import("resource://modules/StringBundle.jsm");

var EXPORTED_SYMBOLS = ["authentificator"];


var authentificator = function() {

    var Authentifier = function() {};

    Authentifier.prototype = {

            modeOffline : false,
            currentLogin : "",
            currentPassword : "",
            currentAppURL : "",
            onSuccess : function() {},
            onError : function() {},
            translate : new StringBundle("chrome://dcpoffline/locale/main.properties"),

            authentifier : function(modeOffline, currentLogin, currentPassword, currentAppURL, onSuccess, onError) {
                logConsole("authentifier");
                var currentTimeout = Preferences.get("offline.application.isConnectedTimeOut", false);
                var configOnConnect = {};

                this.modeOffline = modeOffline;
                this.currentLogin = currentLogin;
                this.currentPassword = currentPassword;
                this.currentAppURL = currentAppURL;
                this.onSuccess = onSuccess;
                this.onError = onError;

                if (! (currentLogin && currentPassword && currentAppURL)) {
                    this.onError(this.translate.get("authent.logInfoIncomplete"));
                    return;
                }
                
                if (this.modeOffline) {
                    this.authentOffline();
                }else {
                    if (this.guessNetworkState()) {
                        context.url = this.currentAppURL;
                        if (currentTimeout) {
                            configOnConnect.timeout = currentTimeout;
                        }
                        configOnConnect.reset = true;
                        configOnConnect.onConnect = this.authentOnline();
                        configOnConnect.onFail = this.authentOnlineFail();
                        context.isConnected(configOnConnect);
                        return;
                    }else {
                        this.authentOffline();
                    }

                }
            },

            authentOnline : function() {

                var that = this;
                
                return function(){
                    var currentProfile;
                    var user;
                    
                    logConsole("authentOnline");
                    
                    user = context.setAuthentification({
                        login : that.currentLogin,
                        password : that.currentPassword
                    });
                    
                    if (user) {
                        offlineSync.recordOfflineDomains();
                        if (user.id) {
                            Preferences.set("offline.user.id", user.id);
                        }
                        if (user.firstname){
                            Preferences.set("offline.user.firstName", user.firstname);
                        }
                        if (user.lastname) {
                            Preferences.set("offline.user.lastName", user.lastname);
                        }
                        if (user.getLocaleFormat()){
                            Preferences.set("offline.user.locale", JSON.stringify(user.getLocaleFormat()));
                        }
                        passwordManager.updatePassword(that.currentLogin, that.currentPassword);
                        that.onSuccess();
                    }else {
                        that.onError(that.translate.get("authent.serverDisagree"));
                    }
                };
            },

            authentOnlineFail: function() {
                
                var that = this;
                
                return function(){
                    logConsole("authentOnlineFail");
                    that.onError(that.translate.get("authent.serverUnreachable"));
                }
            },

            authentOffline : function() {
                logConsole("authentOffline");
                var result = passwordManager.checkPassword(this.currentLogin, this.currentPassword);
                if (result.result) {
                    this.onSuccess();
                }else {
                    this.onError(result.reason);
                }
            },

            guessNetworkState : function() {
                logConsole("guessNetworkState");
                return !(networkChecker.isOffline());
            }
    };

    return ( {
        authent: function(param, onSuccess, onError) {
            var authent = new Authentifier();
                authent.authentifier(param.modeOffline, param.currentLogin, param.currentPassword, param.currentApplicationURL, onSuccess, onError);
        }
    }
    )

}();

log('authentifier loaded');