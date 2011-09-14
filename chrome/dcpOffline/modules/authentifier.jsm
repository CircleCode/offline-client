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
Cu.import("resource://modules/events.jsm");

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
                    
                    
                    user = context.setAuthentification({
                        login : that.currentLogin,
                        password : that.currentPassword
                    });
                    
                    if (user) {
                        try {
                            offlineSync.recordOfflineDomains();
                            logConsole("authentOnline user :"+user.login);
                            if (user.id) {
                                Preferences.set("offline.user.id", user.id);
                            }
                            if (user.firstname){
                                Preferences.set("offline.user.firstName", user.firstname);
                            }
                            if (user.lastname) {
                                Preferences.set("offline.user.lastName", user.lastname);
                            }
                            if (user.locale) {
                                if (!Preferences.get("offline.application.debug.locale", false)) {
                                    if (Preferences.get("general.useragent.locale") != user.locale) {
                                        if (that.switchLocale(user.locale)) {
                                            applicationEvent.publish("needRestart", "changeLocal");
                                        }else {
                                            logDebug("unable to switch local because it doesn't exist "+user.locale);
                                        }
                                    }
                                }else {
                                    logConsole("debuglocal");
                                    if (Preferences.get("offline.application.debug.locale") != Preferences.get("general.useragent.locale")) {
                                        that.switchLocale(Preferences.get("offline.application.debug.locale"));
                                    }
                                }
                                Preferences.set("offline.user.serverLocale", user.locale);
                            }
                            if (user.getLocaleFormat()){
                                Preferences.set("offline.user.localeFormat", JSON.stringify(user.getLocaleFormat()));
                            }
                            passwordManager.updatePassword(that.currentLogin, that.currentPassword);
                            that.onSuccess();
                        } catch (ex) {
                            that.onError(that.translate.get("authent.serverDenied"));
                        }
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
            },
            
            switchLocale : function(serverLocale) {
                logConsole("switchLocale "+serverLocale);
                var chromeRegService = Components.classes["@mozilla.org/chrome/chrome-registry;1"].getService();
                var toolkitChromeReg = chromeRegService.QueryInterface(Components.interfaces.nsIToolkitChromeRegistry);
                var availableLocales = toolkitChromeReg.getLocalesForPackage("dcpoffline");
                var locale = "";
                
                while(availableLocales.hasMore()) {
                    locale = availableLocales.getNext();
                    logConsole("locale "+locale);
                    if (locale == serverLocale) {
                        Preferences.set("general.useragent.locale", locale);
                        return true;
                    }
                }
                
                return false;
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