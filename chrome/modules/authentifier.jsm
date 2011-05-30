const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/network.jsm");
Cu.import("resource://modules/fdl-data-debug.jsm");
Cu.import("resource://modules/fdl-context.jsm");
Cu.import("resource://modules/preferences.jsm");

var EXPORTED_SYMBOLS = ["authentificator"];


var authentificator = function() {

    var Authentifier = function() {};

    Authentifier.prototype = {

            modeOffline : false,
            currentLogin : "",
            currentPassword : "",
            currentAppURL : "",
            result : {},
            //profileService : Cc["@mozilla.org/toolkit/profile-service;1"].createInstance(Ci.nsIToolkitProfileService),            

            authentifier : function(modeOffline, currentLogin, currentPassword, currentAppURL) {
                var networkState;

                logConsole("try to authent");
                if (! (currentLogin && currentPassword && currentAppURL)) {
                    return {result : null , reason : "authent.logInfoIncomplete"};
                }

                this.modeOffline = modeOffline;
                this.currentLogin = currentLogin;
                this.currentPassword = currentPassword;
                this.currentAppURL = currentAppURL;

                if (this.modeOffline) {
                    logConsole("mode offline");
                    this.authentOffline();
                }else {
                    if (this.guessNetworkState()) {
                        logConsole("try to authent online");
                        this.authentOnline();
                    }else {
                        logConsole("no network");
                        this.authentOffline();
                    }

                }
                return this.result;
            },

            authentOnline : function() {
                var isAuthentified;
                var currentProfile;
                context.url = this.currentAppURL;
                logConsole("try to connect");
                if (context.isConnected()) {
                    logConsole("try to authent");
                    isAuthentified = context.setAuthentification({
                        login : this.currentLogin,
                        password : this.currentPassword
                    });
                    if (isAuthentified) {
                        /*try {
                            currentProfile = this.profileService.getProfileByName(getProfileName());
                        } catch(NS_ERROR_FAILURE) {
                            currentProfile = this.profileService.createProfile(null, null, this.getProfileName());
                        }
                        this.profileService.selectedProfile = currentProfile;
                        this.profileService.flush();*/
                        this.result = {result : true};
                    }else {
                        this.result = {result : false, reason : "authent.serverDisagree"};
                    }
                }else {
                    this.result = {result : false, reason : "authent.serverUnreachable"};
                }
            },

            authentOffline : function() {
                var currentProfile;
                try {
                    /*currentProfile = this.profileService.getProfileByName(this.getProfileName());
                    this.profileService.selectedProfile = currentProfile;*/
                    if (this.checkPassword()) {
                        this.result = {result : true};
                    }else {
                        this.result = {result : false, reason : "authent.badPassword"};
                    }
                }
                catch(NS_ERROR_FAILURE) {
                    this.result = {result : false, reason : "authent.nonExistentProfilOffline"};
                }
            },

            getProfileName : function() {
                return this.currentAppURL+"_"+this.currentLogin;
            },

            checkPassword : function() {
                if (Preferences.get("offline.user.password") == currentPassword) {
                    return true;
                }
                return false;
            },
            
            guessNetworkState : function() {
                return !(networkChecker.isOffline());
            }
    };

    return ( {
        authent: function(modeOffline, currentLogin, currentPassword, currentAppURL) {
            var authent = new Authentifier();
            return authent.authentifier(modeOffline, currentLogin, currentPassword, currentAppURL);
        }
    }
    )

}();

log('authentifier loaded');