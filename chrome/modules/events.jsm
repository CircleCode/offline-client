const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");

var EXPORTED_SYMBOLS = ["applicationEvent"]

function MicroEvent(){};

MicroEvent.prototype = {

        subscribe : function(event, fct, config){
            this._events = this._events || {};
            config =  config || {};
            this._events[event] = this._events[event] || [];
            this._events[event].push({ fct : fct, config : config});
            return this;
        },

        unsubscribe : function(event, fct){
            this._events = this._events || {};
            if(this._events.hasOwnProperty(event) === false  ) {
                return this;
            }
            var index = -1;
            var currentEvents = [];
            for(var i = 0; i < this._events[event].length ; i++) {
                if (this._events[event][i].fct !== fct) {
                    currentEvents.push({ fct : this._events[event][i].fct, config : this._events[event][i].config});
                }
            }
            this._events[event] = currentEvents;
            return this;
        },

        publish : function(event /* , args... */){
            var returnValue = true;
            this._events = this._events || {};
            if( event in this._events === false  ) {
                return this;
            }
            for(var i = 0; i < this._events[event].length; i++){
                var currentSubscriber = this._events[event][i];
                if (this.doIt(event, currentSubscriber.fct, Array.prototype.slice.call(arguments, 1), currentSubscriber.config) === false) {
                    returnValue = false;
                }
            }
            return returnValue;
        },

        doIt : function(currentEvent, fct, arguments, config) {
            var scope;
            if (config.scope) {
                scope = config.scope;
            }else {
                scope = this;
            }
            try {
                return fct.apply(scope, arguments)
            } catch (error) {
                if (config.onError) {
                    return this.doIt(currentEvent, config.onError, [error], {scope : scope});
                } else {
                    logConsole("Events.jsm : for the event "+currentEvent+" "+error.message+" "+error.fileName+" "+error.lineNumber+" "+error);
                    logError("Events.jsm : for the event "+currentEvent+" "+error.message+" "+error.fileName+" "+error.lineNumber+" "+error);
                }
                return true;
            }
        }
};

var applicationEvent = new MicroEvent();
