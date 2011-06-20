Components.utils.import("resource://modules/preferences.jsm");
Components.utils.import("resource://modules/logger.jsm");

let userLocaleFormat = JSON.parse(
        Preferences.get(
                "offline.user.localeFormat",
                "{\"dateFormat\":\"%d/%m/%Y\",\"timeFormat\":\"%H:%M:%S\",\"dateTimeFormat\":\"%d/%m/%Y %H:%M\"}"
        )
);

Date.prototype._userDateFormat = userLocaleFormat.dateFormat;
Date.prototype._userTimeFormat = userLocaleFormat.timeFormat;
Date.prototype._userDateTimeFormat = userLocaleFormat.dateTimeFormat;

Date.prototype._toLocaleFormat = Date.prototype.toLocaleFormat;

Date.prototype.toLocaleFormat= function(format){
    switch(format){
        case '':
        case '%x':
            format = Date.prototype._userDateFormat;
            break;
        case '%X':
            format = Date.prototype._userTimeFormat;
            break;
        case '%xX':
            format = Date.prototype._userDateTimeFormat;
            break;
    }
    return Date.prototype._toLocaleFormat.call(this,format);
};

logConsole("local date format has been redefined to : "+userLocaleFormat.dateFormat+"\n");
logConsole("local time format has been redefined to : "+userLocaleFormat.timeFormat+"\n");
logConsole("local datetime format has been redefined to : "+userLocaleFormat.dateTimeFormat+"\n");