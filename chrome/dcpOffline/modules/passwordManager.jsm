const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");
Cu.import("resource://modules/StringBundle.jsm");

var EXPORTED_SYMBOLS = ["passwordManager"];

var passwordManager = function() {

    var PasswordManager = function() {};

    PasswordManager.prototype = {

            loginManager : Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager),
            nsLoginInfo: new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Ci.nsILoginInfo, "init"),
            translate : new StringBundle("chrome://dcpoffline/locale/main.properties"),

            checkPassword : function(login, password) {

                var currentLogin = this.getCurrentLogin(login);

                if (currentLogin){
                    if (password == currentLogin.password){
                        return {result : true};
                    }else {
                        return {result : false, reason : this.translate.get("passwordManager.loginUnknown")};
                    }
                }
                return {result : false, reason : this.translate.get("passwordManager.passwordMismatch")};
            },

            updatePassword : function(login, password) {

                var newLogin = new this.nsLoginInfo('chrome://dcpoffline', null, 'User Registration', login, password, "", "");
                var currentLogin = this.getCurrentLogin(login);

                if (currentLogin) {
                    this.loginManager.modifyLogin(currentLogin, newLogin);
                } else {
                    this.addPassword(login, password);
                }
            },

            getPassword : function(login) {
                var currentLogin = this.getCurrentLogin(login);
                if (currentLogin) {
                    return currentLogin.password;
                }else{
                    return false;
                }

            },

            addPassword : function(login, password) {
                var newLogin = new this.nsLoginInfo('chrome://dcpoffline', null, 'User Registration', login, password, "", "");
                this.loginManager.addLogin(newLogin);
            },

            getCurrentLogin : function(login) {
                var logins = this.loginManager.findLogins({}, 'chrome://dcpoffline', null, 'User Registration');

                for (var i = 0; i < logins.length; i++) {
                    if (logins[i].username == login) {
                        return logins[i];
                    }
                }
                return false;
            }

    };

    return ({
        checkPassword : function(login, password) {
            var passwordManager = new PasswordManager();
            return passwordManager.checkPassword(login, password);
        },
        updatePassword : function(login, password) {
            var passwordManager = new PasswordManager();
            return passwordManager.updatePassword(login, password);
        },
        addPassword : function(login, password) {
            var passwordManager = new PasswordManager();
            return passwordManager.addPassword(login, password);
        },
        getPassword : function(login) {
            var passwordManager = new PasswordManager();
            return passwordManager.getPassword(login);
        }
    }

    );

}();

