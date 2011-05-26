const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://modules/logger.jsm");

var EXPORTED_SYMBOLS = ["applicationEvent"]

function MicroEvent(){};

MicroEvent.prototype = {
        
        subscribe : function(event, fct, config){
            this._events = this._events || {};
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
                var scope;
                if (currentSubscriber.config && currentSubscriber.config.scope) {
                    scope = currentSubscriber.scope;
                }else {
                    scope = this;
                }
                if (!this.doIt(event, currentSubscriber.fct, scope, Array.prototype.slice.call(arguments, 1))) {
                    returnValue = false;
                }
            }
            return returnValue;
        },
        
        doIt : function(currentEvent, fct, scope, arguments) {
            try {
                return fct.apply(scope, arguments)
            }catch (e) {
                logConsole("Events.jsm : Unable to execute "+e+" for the event "+currentEvent);
                return true;
            }
        }
};

var applicationEvent = new MicroEvent();
